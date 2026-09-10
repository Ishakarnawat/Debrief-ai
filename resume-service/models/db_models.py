from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    experience_level = Column(String(50), nullable=True)
    raw_content = Column(Text, nullable=False)
    required_skills = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    evaluations = relationship("ATSEvaluation", back_populates="job", cascade="all, delete-orphan")


class ResumeCandidate(Base):
    __tablename__ = "resume_candidates"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String(255), nullable=True)
    candidate_email = Column(String(255), nullable=True, index=True)
    candidate_phone = Column(String(50), nullable=True)
    raw_file_name = Column(String(255), nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    evaluations = relationship("ATSEvaluation", back_populates="candidate", cascade="all, delete-orphan")


class ATSEvaluation(Base):
    __tablename__ = "ats_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("resume_candidates.id", ondelete="SET NULL"), nullable=True, index=True)

    overall_score = Column(Float, nullable=False)
    hard_skills_score = Column(Float, nullable=False)
    experience_score = Column(Float, nullable=False)
    education_score = Column(Float, nullable=False)
    formatting_score = Column(Float, nullable=False)

    skills_matrix = Column(JSON, nullable=False)
    strengths = Column(JSON, nullable=True)
    weaknesses_or_red_flags = Column(JSON, nullable=True)
    actionable_recommendations = Column(JSON, nullable=True)
    hiring_recommendation = Column(String(50), nullable=False)

    interview_token = Column(String(255), nullable=True)
    status = Column(String(50), default="evaluated")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("JobDescription", back_populates="evaluations")
    candidate = relationship("ResumeCandidate", back_populates="evaluations")
