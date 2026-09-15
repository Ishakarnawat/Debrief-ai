from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    database: str
    environment: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class JobBase(BaseModel):
    title: str = Field(..., example="Senior Full-Stack Engineer")
    department: Optional[str] = Field(None, example="Engineering")
    experience_level: Optional[str] = Field("Mid", example="Senior")
    raw_content: str = Field(..., description="Full job description text")
    required_skills: Optional[List[str]] = Field(default_factory=list, example=["Python", "FastAPI", "React", "PostgreSQL"])

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    created_at: datetime
    evaluation_count: int = 0

    class Config:
        from_attributes = True

class CandidateBase(BaseModel):
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    raw_file_name: str

class CandidateCreate(CandidateBase):
    extracted_text: Optional[str] = None

class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RubricScoresSchema(BaseModel):
    hard_skills: float
    experience_relevance: float
    education_qualification: float
    formatting_clarity: float

class SkillGapSchema(BaseModel):
    matched_skills: List[str] = Field(default_factory=list)
    missing_critical_skills: List[str] = Field(default_factory=list)
    transferable_skills: List[str] = Field(default_factory=list)

class ATSEvaluationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: Optional[int]
    overall_score: float
    rubric_scores: RubricScoresSchema
    skills_matrix: SkillGapSchema
    strengths: List[str] = Field(default_factory=list)
    weaknesses_or_red_flags: List[str] = Field(default_factory=list)
    actionable_recommendations: List[str] = Field(default_factory=list)
    hiring_recommendation: str
    interview_token: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Phase 2: Document Ingestion Schemas

class SanitizationReport(BaseModel):
    original_length: int
    clean_length: int
    invisible_chars_removed: int
    flagged_injections: List[str] = Field(default_factory=list)
    is_suspicious: bool = False


class ExtractedMetadata(BaseModel):
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None


class DocumentParseResponse(BaseModel):
    file_name: str
    file_type: str
    file_size_bytes: int
    page_count: int
    word_count: int
    char_count: int
    extracted_metadata: ExtractedMetadata
    sanitization_report: SanitizationReport
    extracted_text: str


class CandidateUploadResult(BaseModel):
    candidate_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    raw_file_name: str
    word_count: int
    status: str = "parsed"
    sanitization_report: Optional[SanitizationReport] = None


class CandidateUploadBatchResponse(BaseModel):
    job_id: int
    total_received: int
    total_succeeded: int
    total_failed: int
    candidates: List[CandidateUploadResult] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


# Phase 3: ATS Screening Response Schemas

class ScreenSingleResponse(BaseModel):
    status: str = "success"
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    file_name: str
    overall_match_score: float
    rubric_scores: RubricScoresSchema
    skills_matrix: SkillGapSchema
    strengths: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    actionable_recommendations: List[str] = Field(default_factory=list)
    hiring_recommendation: str
    interview_recommendation: str
    suggested_interview_questions: List[str] = Field(default_factory=list)
    interview_token: Optional[str] = None
    evaluation_provider: str = "gemini-2.5-flash"
    sanitization_report: Optional[SanitizationReport] = None


class BatchScreenResponse(BaseModel):
    job_title: str
    total_screened: int
    qualified_count: int
    results: List[ScreenSingleResponse] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


# Phase 6: Benchmark & Evaluation Schemas

class LatencyMetrics(BaseModel):
    p50_seconds: float
    p95_seconds: float
    p99_seconds: float
    mean_seconds: float
    min_seconds: float
    max_seconds: float
    resumes_per_second: float


class ConfusionMatrix(BaseModel):
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class ClassificationMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: ConfusionMatrix
    qualification_threshold: float = 75.0


class SecurityBenchmark(BaseModel):
    injection_attempts_tested: int
    injections_neutralized: int
    defense_success_rate: float
    zero_width_detection_rate: float


class CandidateEvaluationSample(BaseModel):
    candidate_name: str
    category: str
    expected_qualification: bool
    actual_score: float
    hiring_recommendation: str
    latency_seconds: float
    passed_threshold: bool


class BenchmarkReportResponse(BaseModel):
    status: str = "success"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dataset_size: int
    model_name: str
    latency_metrics: LatencyMetrics
    classification_metrics: ClassificationMetrics
    security_benchmark: SecurityBenchmark
    detailed_samples: List[CandidateEvaluationSample] = Field(default_factory=list)



