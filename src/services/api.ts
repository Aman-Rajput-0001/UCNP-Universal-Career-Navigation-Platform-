import type {
  StudentProfileForm,
  StudentProfileResponse,
  CareerDiscoveryResponse,
  FullCareerAnalysisResponse,
  EligibilityCheckPayload,
  EligibilityCheckResponse,
  SkillGapPayload,
  SkillGapResponse,
  RoadmapGeneratePayload,
  RoadmapGenerateResponse,
  RoadmapReplanPayload,
  RoadmapReplanResponse,
  LearningRecommendationPayload,
  LearningRecommendationResponse,
  ProjectRecommendationPayload,
  ProjectRecommendationResponse,
  CareerPathwayPayload,
  CareerPathwayResponse,
  CareerGrowthPayload,
  CareerGrowthResponse,
  MarketTrendsPayload,
  MarketTrendsResponse,
  ProgressUpdatePayload,
  RoadmapProgressData,
  CareerSimulationRequest,
  CareerSimulationResponse,
  ContextualAssistPayload,
  ContextualAssistResponse,
  InterviewGeneratePayload,
  InterviewGenerateResponse,
  InterviewAnswerPayload,
  InterviewAnswerEvaluation,
  MockInterviewStartPayload,
  MockInterviewSubmitAnswerPayload,
  MockInterviewFinishPayload,
  MockInterviewSessionResponse,
} from '../types/workflow'

export interface HealthStatusResponse {
  status: string
  service: string
}

export interface CareerDiscoveryPayload {
  profile_id?: string
  education: string
  degree?: string
  branch?: string
  currentYear?: string
  skills: string[]
  interests: string[]
  strengths: string[]
  weaknesses: string[]
  careerGoal?: string
  availableTime?: string
}

// In production on Vercel, requests to /api route directly to the serverless function if VITE_API_BASE_URL is not set
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? ''
    : 'http://127.0.0.1:8000')

/**
 * Checks backend health endpoint
 */
export async function checkBackendHealth(): Promise<{
  connected: boolean
  data?: HealthStatusResponse
  error?: string
}> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        connected: false,
        error: `HTTP ${response.status}`,
      }
    }

    const data: HealthStatusResponse = await response.json()
    return {
      connected: data.status === 'ok',
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Connection failed'
    return {
      connected: false,
      error: errorMsg,
    }
  }
}

/**
 * Submits student profile to FastAPI backend and returns normalized result
 */
export async function submitStudentProfile(
  formData: StudentProfileForm
): Promise<{
  success: boolean
  data?: StudentProfileResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore parse error
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: StudentProfileResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network error submitting profile'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls AI Career Discovery endpoint
 */
export async function discoverCareersApi(
  payload: CareerDiscoveryPayload
): Promise<{
  success: boolean
  data?: CareerDiscoveryResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore json error
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: CareerDiscoveryResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to call career discovery AI'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls Unified AI Orchestrator providing complete 12-part career transition analysis
 */
export async function orchestrateCareerAnalysisApi(
  payload: CareerDiscoveryPayload
): Promise<{
  success: boolean
  data?: FullCareerAnalysisResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore json error
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: FullCareerAnalysisResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to orchestrate career transition analysis'
    return {
      success: false,
      error: errorMsg,
    }
  }
}


/**
 * Calls authoritative eligibility checker endpoint
 */
export async function checkEligibilityApi(
  payload: EligibilityCheckPayload
): Promise<{
  success: boolean
  data?: EligibilityCheckResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: EligibilityCheckResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to check eligibility'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls skill gap analysis endpoint
 */
export async function analyzeSkillGapApi(
  payload: SkillGapPayload
): Promise<{
  success: boolean
  data?: SkillGapResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/skill-gap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: SkillGapResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to analyze skill gap'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls AI Personalized Career Roadmap generation endpoint
 */
export async function generateRoadmapApi(
  payload: RoadmapGeneratePayload
): Promise<{
  success: boolean
  data?: RoadmapGenerateResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/roadmap/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore json error
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: RoadmapGenerateResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate career roadmap'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls dynamic roadmap replanning endpoint
 */
export async function replanRoadmapApi(
  payload: RoadmapReplanPayload
): Promise<{
  success: boolean
  data?: RoadmapReplanResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/roadmap/replan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: RoadmapReplanResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to replan roadmap'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls Learning recommendation endpoint
 */
export async function fetchLearningRecommendationsApi(
  payload: LearningRecommendationPayload
): Promise<{
  success: boolean
  data?: LearningRecommendationResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendation/learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: LearningRecommendationResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch learning recommendations'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls Project recommendation endpoint
 */
export async function fetchProjectRecommendationsApi(
  payload: ProjectRecommendationPayload
): Promise<{
  success: boolean
  data?: ProjectRecommendationResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendation/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: ProjectRecommendationResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch project recommendations'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls Career Pathway progression endpoint
 */
export async function fetchCareerPathwayApi(
  payload: CareerPathwayPayload
): Promise<{
  success: boolean
  data?: CareerPathwayResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/pathway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: CareerPathwayResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate career pathway progression'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Calls dedicated Career Growth progression endpoint
 * POST /api/career/growth
 */
export async function fetchCareerGrowthApi(
  payload: CareerGrowthPayload
): Promise<{
  success: boolean
  data?: CareerGrowthResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/growth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: CareerGrowthResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate career growth stages'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Update and persist progress for a roadmap step
 * POST /api/progress
 */
export async function updateRoadmapProgressApi(payload: ProgressUpdatePayload): Promise<{
  success: boolean
  data?: RoadmapProgressData
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: RoadmapProgressData = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update progress'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Retrieve persisted progress for a roadmap
 * GET /api/progress/{roadmap_id}
 */
export async function fetchRoadmapProgressApi(roadmapId: string): Promise<{
  success: boolean
  data?: RoadmapProgressData
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/${encodeURIComponent(roadmapId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: RoadmapProgressData = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch roadmap progress'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Simulate an alternative what-if career pathway
 * POST /api/career/simulate
 */
export async function simulateCareerApi(payload: CareerSimulationRequest): Promise<{
  success: boolean
  data?: CareerSimulationResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/career/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: CareerSimulationResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to simulate career pathway'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Fetch contextual AI assistance for a specific workflow node
 * POST /api/contextual-assist
 */
export async function fetchContextualAssistApi(payload: ContextualAssistPayload): Promise<{
  success: boolean
  data?: ContextualAssistResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contextual-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: ContextualAssistResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch contextual assistance'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Generate role-specific interview preparation questions
 * POST /api/interview/generate
 */
export async function generateInterviewQuestionsApi(payload: InterviewGeneratePayload): Promise<{
  success: boolean
  data?: InterviewGenerateResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: InterviewGenerateResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate interview questions'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Evaluate student written answer to interview question
 * POST /api/interview/evaluate
 */
export async function evaluateInterviewAnswerApi(payload: InterviewAnswerPayload): Promise<{
  success: boolean
  data?: InterviewAnswerEvaluation
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: InterviewAnswerEvaluation = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to evaluate interview answer'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Start an interactive AI Mock Interview session
 * POST /api/mock-interview/start
 */
export async function startMockInterviewApi(payload: MockInterviewStartPayload): Promise<{
  success: boolean
  data?: MockInterviewSessionResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mock-interview/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: MockInterviewSessionResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to start mock interview session'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Submit candidate answer in active mock interview session
 * POST /api/mock-interview/answer
 */
export async function submitMockInterviewAnswerApi(payload: MockInterviewSubmitAnswerPayload): Promise<{
  success: boolean
  data?: MockInterviewSessionResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mock-interview/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: MockInterviewSessionResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to submit mock interview answer'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Complete the mock interview session and synthesize final evaluation report
 * POST /api/mock-interview/finish
 */
export async function finishMockInterviewApi(payload: MockInterviewFinishPayload): Promise<{
  success: boolean
  data?: MockInterviewSessionResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mock-interview/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: MockInterviewSessionResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to finalize mock interview'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Retrieve stored mock interview session from database
 * GET /api/mock-interview/{session_id}
 */
export async function getMockInterviewSessionApi(sessionId: string): Promise<{
  success: boolean
  data?: MockInterviewSessionResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mock-interview/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: MockInterviewSessionResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch mock interview session'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Fetch Market Trends, In-Demand Skills, Occupation Changes, and Future Skills
 * POST /api/market/trends
 */
export async function fetchMarketTrendsApi(
  payload: MarketTrendsPayload
): Promise<{
  success: boolean
  data?: MarketTrendsResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/trends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let detail = `Error ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          detail = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
      } catch {
        // ignore
      }
      return {
        success: false,
        error: detail,
      }
    }

    const data: MarketTrendsResponse = await response.json()
    return {
      success: true,
      data,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch market trends'
    return {
      success: false,
      error: errorMsg,
    }
  }
}




