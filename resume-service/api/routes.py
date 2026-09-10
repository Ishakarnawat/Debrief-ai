from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from core.database import get_db
from core.config import settings
from models.db_models import JobDescription, ATSEvaluation, ResumeCandidate
from models.schemas import (
    HealthResponse,
    JobCreate,
    JobResponse,
    ATSEvaluationResponse,
    RubricScoresSchema,
    SkillGapSchema
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
