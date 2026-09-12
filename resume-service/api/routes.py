from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from core.database import get_db
from core.config import settings
from core.file_validator import validate_upload_file
from services.document_parser import DocumentParser
from services.gemini_screener import GeminiATSScreener
from models.db_models import JobDescription, ATSEvaluation, ResumeCandidate
from models.schemas import (
    HealthResponse,
    JobCreate,
    JobResponse,
    ATSEvaluationResponse,
    RubricScoresSchema,
    SkillGapSchema,
    DocumentParseResponse,
    ExtractedMetadata,
    SanitizationReport,
    CandidateUploadResult,
    CandidateUploadBatchResponse,
    ScreenSingleResponse,
    BatchScreenResponse
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Verifies service health and relational database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return HealthResponse(
        status="healthy" if "unreachable" not in db_status else "degraded",
        database=db_status,
        environment=settings.ENVIRONMENT
    )

@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED, tags=["Jobs"])
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    """Registers a new Job Description into the ATS database."""
    job = JobDescription(
        title=job_in.title,
        department=job_in.department,
        experience_level=job_in.experience_level,
        raw_content=job_in.raw_content,
        required_skills=job_in.required_skills
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return JobResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        experience_level=job.experience_level,
        raw_content=job.raw_content,
        required_skills=job.required_skills or [],
        created_at=job.created_at,
        evaluation_count=0
    )

@router.get("/jobs", response_model=List[JobResponse], tags=["Jobs"])
def list_jobs(db: Session = Depends(get_db)):
    """Lists all stored Job Descriptions with their ATS candidate count."""
    jobs = db.query(JobDescription).order_by(JobDescription.created_at.desc()).all()
    results = []
    for job in jobs:
        eval_count = db.query(ATSEvaluation).filter(ATSEvaluation.job_id == job.id).count()
        results.append(
            JobResponse(
                id=job.id,
                title=job.title,
                department=job.department,
                experience_level=job.experience_level,
                raw_content=job.raw_content,
                required_skills=job.required_skills or [],
                created_at=job.created_at,
                evaluation_count=eval_count
            )
        )
    return results

@router.get("/jobs/{job_id}", response_model=JobResponse, tags=["Jobs"])
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Fetches details for a specific Job Description."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    eval_count = db.query(ATSEvaluation).filter(ATSEvaluation.job_id == job.id).count()
    return JobResponse(
        id=job.id,
        title=job.title,
        department=job.department,
        experience_level=job.experience_level,
        raw_content=job.raw_content,
        required_skills=job.required_skills or [],
        created_at=job.created_at,
        evaluation_count=eval_count
    )

@router.get("/jobs/{job_id}/rankings", response_model=List[ATSEvaluationResponse], tags=["ATS Evaluations"])
def get_job_rankings(job_id: int, db: Session = Depends(get_db)):
    """Retrieves all candidate evaluations ranked by overall ATS score descending."""
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
        
    evaluations = (
        db.query(ATSEvaluation)
        .filter(ATSEvaluation.job_id == job_id)
        .order_by(ATSEvaluation.overall_score.desc())
        .all()
    )
    
    results = []
    for ev in evaluations:
        results.append(
            ATSEvaluationResponse(
                id=ev.id,
                job_id=ev.job_id,
                candidate_id=ev.candidate_id,
                overall_score=ev.overall_score,
                rubric_scores=RubricScoresSchema(
                    hard_skills=ev.hard_skills_score,
                    experience_relevance=ev.experience_score,
                    education_qualification=ev.education_score,
                    formatting_clarity=ev.formatting_score
                ),
                skills_matrix=SkillGapSchema(**(ev.skills_matrix or {})),
                strengths=ev.strengths or [],
                weaknesses_or_red_flags=ev.weaknesses_or_red_flags or [],
                actionable_recommendations=ev.actionable_recommendations or [],
                hiring_recommendation=ev.hiring_recommendation,
                interview_token=ev.interview_token,
                status=ev.status,
                created_at=ev.created_at
            )
        )
    return results


@router.post("/resumes/parse", response_model=DocumentParseResponse, tags=["Document Ingestion"])
async def parse_resume_document(file: UploadFile = File(...)):
    """
    Uploads and parses a single resume document (.pdf, .docx, .txt).
    Validates file integrity, strips zero-width/invisible characters,
    neutralizes adversarial prompt injections, extracts contact metadata,
    and returns sanitized text with structural analytics.
    """
    file_bytes = await validate_upload_file(file)
    try:
        parsed = DocumentParser.parse_document(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse document '{file.filename}': {str(e)}"
        )

    return DocumentParseResponse(
        file_name=parsed.file_name,
        file_type=parsed.file_type,
        file_size_bytes=parsed.file_size_bytes,
        page_count=parsed.page_count,
        word_count=parsed.word_count,
        char_count=parsed.char_count,
        extracted_metadata=ExtractedMetadata(
            candidate_name=parsed.candidate_name,
            candidate_email=parsed.candidate_email,
            candidate_phone=parsed.candidate_phone
        ),
        sanitization_report=SanitizationReport(
            original_length=parsed.sanitization_report.get("original_length", 0),
            clean_length=parsed.sanitization_report.get("clean_length", 0),
            invisible_chars_removed=parsed.sanitization_report.get("invisible_chars_removed", 0),
            flagged_injections=parsed.sanitization_report.get("flagged_injections", []),
            is_suspicious=parsed.sanitization_report.get("is_suspicious", False)
        ),
        extracted_text=parsed.extracted_text
    )


@router.post(
    "/jobs/{job_id}/resumes/upload",
    response_model=CandidateUploadBatchResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Document Ingestion"]
)
async def upload_job_resumes(
    job_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Batch uploads resume files (.pdf, .docx, .txt) linked to a specific Job Description.
    Parses and sanitizes each file, extracts contact metadata, and persists
    records to the ResumeCandidate database table for subsequent ATS scoring.
    """
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided for upload.")

    results: List[CandidateUploadResult] = []
    errors: List[str] = []

    for file in files:
        try:
            file_bytes = await validate_upload_file(file)
            parsed = DocumentParser.parse_document(file_bytes, file.filename)

            # Persist candidate profile
            candidate = ResumeCandidate(
                candidate_name=parsed.candidate_name,
                candidate_email=parsed.candidate_email,
                candidate_phone=parsed.candidate_phone,
                raw_file_name=parsed.file_name,
                extracted_text=parsed.extracted_text
            )
            db.add(candidate)
            db.flush()

            report_dict = parsed.sanitization_report
            san_report = SanitizationReport(
                original_length=report_dict.get("original_length", 0),
                clean_length=report_dict.get("clean_length", 0),
                invisible_chars_removed=report_dict.get("invisible_chars_removed", 0),
                flagged_injections=report_dict.get("flagged_injections", []),
                is_suspicious=report_dict.get("is_suspicious", False)
            )

            results.append(
                CandidateUploadResult(
                    candidate_id=candidate.id,
                    candidate_name=candidate.candidate_name,
                    candidate_email=candidate.candidate_email,
                    candidate_phone=candidate.candidate_phone,
                    raw_file_name=candidate.raw_file_name,
                    word_count=parsed.word_count,
                    status="parsed",
                    sanitization_report=san_report
                )
            )
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")

    db.commit()

    return CandidateUploadBatchResponse(
        job_id=job_id,
        total_received=len(files),
        total_succeeded=len(results),
        total_failed=len(errors),
        candidates=results,
        errors=errors
    )


# ─── Phase 3: Gemini GenAI ATS Screening Endpoints ─────────────────────────

@router.post("/screen", response_model=ScreenSingleResponse, tags=["ATS Screening"])
async def screen_resume_realtime(
    resume_file: UploadFile = File(..., description="Resume binary file (.pdf, .docx, .txt)"),
    job_title: str = Form(..., description="Target Job Title"),
    job_description: str = Form(..., description="Detailed Job Description & Requirements"),
    experience_level_required: Optional[str] = Form("Mid", description="Junior, Mid, Senior, Lead")
):
    """
    Real-time ATS screening of a single resume against a target job specification.
    1. Validates file security and size bounds (max 10MB)
    2. Parses and sanitizes text, stripping zero-width tokens and neutralizing injections
    3. Executes Gemini GenAI structured rubric scoring or deterministic fallback
    4. Computes deterministic weighted ATS match score
    5. Returns candidate strengths, skill gaps, rubric scores, and autonomous interview token
    """
    file_bytes = await validate_upload_file(resume_file)
    try:
        parsed = DocumentParser.parse_document(file_bytes, resume_file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract document contents: {str(e)}"
        )

    scorecard = GeminiATSScreener.screen_resume(
        resume_text=parsed.extracted_text,
        job_title=job_title,
        job_description=job_description,
        candidate_name=parsed.candidate_name,
        candidate_email=parsed.candidate_email,
        candidate_phone=parsed.candidate_phone,
        raw_file_name=parsed.file_name,
        experience_level_required=experience_level_required
    )

    rep = parsed.sanitization_report
    san_report = SanitizationReport(
        original_length=rep.get("original_length", 0),
        clean_length=rep.get("clean_length", 0),
        invisible_chars_removed=rep.get("invisible_chars_removed", 0),
        flagged_injections=rep.get("flagged_injections", []),
        is_suspicious=rep.get("is_suspicious", False)
    )

    return ScreenSingleResponse(
        status="success",
        candidate_name=scorecard.candidate_name,
        email=scorecard.candidate_email,
        phone=scorecard.candidate_phone,
        file_name=scorecard.raw_file_name,
        overall_match_score=scorecard.overall_score,
        rubric_scores=scorecard.rubric_scores,
        skills_matrix=scorecard.skills_matrix,
        strengths=scorecard.strengths,
        concerns=scorecard.concerns,
        actionable_recommendations=scorecard.actionable_recommendations,
        hiring_recommendation=scorecard.hiring_recommendation,
        interview_recommendation=scorecard.interview_recommendation,
        suggested_interview_questions=scorecard.suggested_interview_questions,
        interview_token=scorecard.interview_token,
        evaluation_provider=scorecard.evaluation_provider,
        sanitization_report=san_report
    )


@router.post("/batch-screen", response_model=BatchScreenResponse, tags=["ATS Screening"])
async def batch_screen_resumes(
    job_title: str = Form(...),
    job_description: str = Form(...),
    experience_level_required: Optional[str] = Form("Mid"),
    files: List[UploadFile] = File(...)
):
    """
    Batch screens up to 20 candidate resumes against a Job Description.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for batch screening.")

    results: List[ScreenSingleResponse] = []
    errors: List[str] = []

    for file in files:
        try:
            file_bytes = await validate_upload_file(file)
            parsed = DocumentParser.parse_document(file_bytes, file.filename)
            scorecard = GeminiATSScreener.screen_resume(
                resume_text=parsed.extracted_text,
                job_title=job_title,
                job_description=job_description,
                candidate_name=parsed.candidate_name,
                candidate_email=parsed.candidate_email,
                candidate_phone=parsed.candidate_phone,
                raw_file_name=parsed.file_name,
                experience_level_required=experience_level_required
            )

            rep = parsed.sanitization_report
            san_report = SanitizationReport(
                original_length=rep.get("original_length", 0),
                clean_length=rep.get("clean_length", 0),
                invisible_chars_removed=rep.get("invisible_chars_removed", 0),
                flagged_injections=rep.get("flagged_injections", []),
                is_suspicious=rep.get("is_suspicious", False)
            )

            results.append(
                ScreenSingleResponse(
                    status="success",
                    candidate_name=scorecard.candidate_name,
                    email=scorecard.candidate_email,
                    phone=scorecard.candidate_phone,
                    file_name=scorecard.raw_file_name,
                    overall_match_score=scorecard.overall_score,
                    rubric_scores=scorecard.rubric_scores,
                    skills_matrix=scorecard.skills_matrix,
                    strengths=scorecard.strengths,
                    concerns=scorecard.concerns,
                    actionable_recommendations=scorecard.actionable_recommendations,
                    hiring_recommendation=scorecard.hiring_recommendation,
                    interview_recommendation=scorecard.interview_recommendation,
                    suggested_interview_questions=scorecard.suggested_interview_questions,
                    interview_token=scorecard.interview_token,
                    evaluation_provider=scorecard.evaluation_provider,
                    sanitization_report=san_report
                )
            )
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")

    qualified_count = sum(1 for r in results if r.overall_match_score >= 75.0)

    return BatchScreenResponse(
        job_title=job_title,
        total_screened=len(results),
        qualified_count=qualified_count,
        results=results,
        errors=errors
    )


@router.post(
    "/jobs/{job_id}/candidates/{candidate_id}/screen",
    response_model=ATSEvaluationResponse,
    tags=["ATS Evaluations"]
)
def screen_job_candidate(
    job_id: int,
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Screens an existing candidate profile against a registered Job Description.
    Stores/updates the ATSEvaluation record in the relational database.
    """
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    candidate = db.query(ResumeCandidate).filter(ResumeCandidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate record not found")

    if not candidate.extracted_text:
        raise HTTPException(status_code=400, detail="Candidate record has no parsed text to evaluate")

    scorecard = GeminiATSScreener.screen_resume(
        resume_text=candidate.extracted_text,
        job_title=job.title,
        job_description=job.raw_content,
        candidate_name=candidate.candidate_name,
        candidate_email=candidate.candidate_email,
        candidate_phone=candidate.candidate_phone,
        raw_file_name=candidate.raw_file_name,
        experience_level_required=job.experience_level
    )

    # Check if evaluation already exists
    evaluation = (
        db.query(ATSEvaluation)
        .filter(ATSEvaluation.job_id == job_id, ATSEvaluation.candidate_id == candidate_id)
        .first()
    )

    if not evaluation:
        evaluation = ATSEvaluation(
            job_id=job.id,
            candidate_id=candidate.id
        )
        db.add(evaluation)

    evaluation.overall_score = scorecard.overall_score
    evaluation.hard_skills_score = scorecard.rubric_scores.hard_skills
    evaluation.experience_score = scorecard.rubric_scores.experience_relevance
    evaluation.education_score = scorecard.rubric_scores.education_qualification
    evaluation.formatting_score = scorecard.rubric_scores.formatting_clarity
    evaluation.skills_matrix = scorecard.skills_matrix.model_dump()
    evaluation.strengths = scorecard.strengths
    evaluation.weaknesses_or_red_flags = scorecard.concerns
    evaluation.actionable_recommendations = scorecard.actionable_recommendations
    evaluation.hiring_recommendation = scorecard.hiring_recommendation
    evaluation.interview_token = scorecard.interview_token
    evaluation.status = "evaluated"

    db.commit()
    db.refresh(evaluation)

    return ATSEvaluationResponse(
        id=evaluation.id,
        job_id=evaluation.job_id,
        candidate_id=evaluation.candidate_id,
        overall_score=evaluation.overall_score,
        rubric_scores=RubricScoresSchema(
            hard_skills=evaluation.hard_skills_score,
            experience_relevance=evaluation.experience_score,
            education_qualification=evaluation.education_score,
            formatting_clarity=evaluation.formatting_score
        ),
        skills_matrix=SkillGapSchema(**(evaluation.skills_matrix or {})),
        strengths=evaluation.strengths or [],
        weaknesses_or_red_flags=evaluation.weaknesses_or_red_flags or [],
        actionable_recommendations=evaluation.actionable_recommendations or [],
        hiring_recommendation=evaluation.hiring_recommendation,
        interview_token=evaluation.interview_token,
        status=evaluation.status,
        created_at=evaluation.created_at
    )


