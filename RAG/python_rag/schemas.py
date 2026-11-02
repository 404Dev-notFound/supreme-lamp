from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    userId: Optional[str] = None
    targetRole: str = Field(..., description="Target role name, e.g. Backend Engineer, Frontend Engineer")
    targetCompanyType: Optional[str] = Field("Product-based company", description="Type of company targeted")
    careerGoals: Optional[List[str]] = Field(default_factory=list, description="Specific goals or areas of interest")
    experienceLevel: Optional[str] = Field("Beginner", description="Beginner | Intermediate | Advanced")
    currentSkills: Optional[List[Union[str, Dict[str, Any]]]] = Field(default_factory=list, description="Current skills known")
    preferredDirection: Optional[str] = Field("Hands-on projects and deep fundamentals", description="Learning preference")
    weeklyCommitmentHours: Optional[int] = Field(10, description="Hours per week user can dedicate")

class SkillGap(BaseModel):
    name: str
    category: Optional[str] = "General"
    importance: str = Field("IMPORTANT", description="CRITICAL | IMPORTANT | RECOMMENDED")
    prerequisites: List[str] = Field(default_factory=list)

class SkillAssessmentRequest(BaseModel):
    profile: Optional[UserProfile] = None
    targetRole: Optional[str] = None
    targetDomain: Optional[str] = None
    currentSkills: Optional[List[Union[str, Dict[str, Any]]]] = None

class SkillAssessmentResponse(BaseModel):
    targetRole: str
    matchedSkills: List[str] = Field(default_factory=list)
    missingPrerequisites: List[str] = Field(default_factory=list)
    criticalGaps: List[str] = Field(default_factory=list)
    recommendedGaps: List[str] = Field(default_factory=list)
    allGaps: List[SkillGap] = Field(default_factory=list)
    readinessScore: float = Field(0.0, description="Estimated readiness percent (0 - 100)")

class ResourceItem(BaseModel):
    title: str
    type: str = Field("documentation", description="documentation | article | video | course")
    url: str

class RoadmapItem(BaseModel):
    topic: str
    whyRecommended: str
    difficulty: str = Field("Intermediate", description="Beginner | Intermediate | Advanced")
    prerequisites: List[str] = Field(default_factory=list)
    estimatedEffort: str = "15 hours (1-2 weeks)"
    recommendedResources: List[ResourceItem] = Field(default_factory=list)
    practiceTasks: List[str] = Field(default_factory=list)
    projectApplication: str
    completionCriteria: str
    nextRecommendedStep: str

class RoadmapStage(BaseModel):
    stageName: str
    stageDescription: str
    items: List[RoadmapItem]

class RoadmapResponse(BaseModel):
    id: Optional[str] = None
    roadmapTitle: str
    summary: str
    estimatedTotalWeeks: int
    targetRole: Optional[str] = None
    stages: List[RoadmapStage]
    provenance: Optional[Dict[str, Any]] = None

# New Comprehensive Roadmap Query & Step Models
class RoadmapQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language search query for career goal, skill or technology")
    experienceLevel: Optional[str] = Field("Beginner", description="Beginner | Intermediate | Advanced")
    goals: Optional[List[str]] = Field(default_factory=list, description="Optional specific goals or target skills")

class RoadmapStep(BaseModel):
    id: str
    topic: str
    stageName: str
    stageIndex: int
    stepIndex: int
    whyItMatters: str
    whatYouWillLearn: str
    prerequisites: List[str] = Field(default_factory=list)
    difficulty: str = "Beginner"
    estimatedEffort: str = "15 hours (1-2 weeks)"
    recommendedCourses: List[Dict[str, Any]] = Field(default_factory=list)
    referenceLinks: List[str] = Field(default_factory=list)
    practicalApplication: str
    completionCriteria: str
    nextStep: str
    status: str = "not_started"

class RoadmapEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None

class PersonalizedRoadmapResponse(BaseModel):
    id: str
    roadmapTitle: str
    userGoal: str
    targetRole: str
    summary: str
    estimatedTotalWeeks: int
    stages: List[Dict[str, Any]]
    steps: List[RoadmapStep]
    edges: List[RoadmapEdge]
    provenance: Dict[str, Any]

class RecommendationItem(BaseModel):
    topic: str
    reason: str
    priority: str = Field("MEDIUM", description="HIGH | MEDIUM | LOW")
    estimatedEffort: str
    practiceMilestone: str

class RecommendationRequest(BaseModel):
    profile: UserProfile
    completedTopics: Optional[List[str]] = Field(default_factory=list)

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    filter: Optional[Dict[str, Any]] = None

class QueryResultItem(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any]
    score: float

class QueryResponse(BaseModel):
    query: str
    results: List[QueryResultItem]
    count: int

class HealthResponse(BaseModel):
    status: str
    provider: str
    vectorStoreCount: int
    models: Dict[str, str]
