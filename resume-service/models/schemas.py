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
