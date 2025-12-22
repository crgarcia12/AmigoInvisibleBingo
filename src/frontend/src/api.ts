const windowEnv = (window as any).ENV?.VITE_API_URL
const API_BASE_URL = (windowEnv && !windowEnv.includes('${')) 
  ? windowEnv 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

interface Predictions {
  [key: string]: string
}

interface UserPrediction {
  userName: string
  predictions: Predictions
  timestamp: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  canReveal?: boolean
}

interface ParticipantStatus {
  userName: string
  hasSubmitted: boolean
  submittedAt: string | null
}

interface StatusResponse {
  totalParticipants: number
  submittedCount: number
  participants: ParticipantStatus[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
}

interface AdminQuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
}

interface QuizAnswerResponse {
  questionId: string
  isCorrect: boolean
}

interface QuizScoreResponse {
  userName: string
  correctAnswers: number
  totalQuestions: number
  score: number
  answers: Array<{
    questionId: string
    answer: string
    isCorrect: boolean
    timestamp: string
  }>
}

interface CombinedScore {
  userName: string
  quizCorrect: number
  quizTotal: number
  predictionsCorrect: number
  predictionsTotal: number
  totalCorrect: number
  totalQuestions: number
  score: number
  hasAdminAnswers: boolean
}

interface ScoreboardEntry {
  userName: string
  quizCorrect: number
  quizTotal: number
  predictionsCorrect: number
  predictionsTotal: number
  totalCorrect: number
  totalQuestions: number
  score: number
}

interface ScoreboardResponse {
  hasAdminAnswers: boolean
  data: ScoreboardEntry[]
}

const headers = {
  'Content-Type': 'application/json',
}

export const api = {
  async submitPredictions(userName: string, predictions: Predictions): Promise<UserPrediction> {
    const response = await fetch(`${API_BASE_URL}/api/predictions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userName, predictions }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit predictions')
    }

    const result: ApiResponse<UserPrediction> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to submit predictions')
    }

    return result.data
  },

  async getUserPredictions(userName: string): Promise<UserPrediction | null> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/${encodeURIComponent(userName)}`, {
      method: 'GET',
      headers,
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get predictions')
    }

    const result: ApiResponse<UserPrediction> = await response.json()
    return result.data || null
  },

  async getParticipantsStatus(): Promise<StatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/status`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get participants status')
    }

    const result: ApiResponse<StatusResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to get participants status')
    }

    return result.data
  },

  async getAllPredictions(): Promise<{ canReveal: boolean; data: UserPrediction[] }> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/all`, {
      method: 'GET',
      headers,
    })

    const result: ApiResponse<UserPrediction[]> = await response.json()

    if (response.status === 403) {
      return { canReveal: false, data: [] }
    }

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get all predictions')
    }

    return {
      canReveal: result.canReveal || false,
      data: result.data || [],
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`)
      return response.ok
    } catch {
      return false
    }
  },

  async getQuizQuestions(userName: string): Promise<QuizQuestion[]> {
    const response = await fetch(`${API_BASE_URL}/api/quiz/questions/${encodeURIComponent(userName)}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get quiz questions')
    }

    const result: ApiResponse<QuizQuestion[]> = await response.json()
    return result.data || []
  },

  async submitQuizAnswer(userName: string, questionId: string, answer: string): Promise<QuizAnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/api/quiz/answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userName, questionId, answer }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit quiz answer')
    }

    const result: ApiResponse<QuizAnswerResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to submit quiz answer')
    }

    return result.data
  },

  async getUserQuizScore(userName: string): Promise<QuizScoreResponse> {
    const response = await fetch(`${API_BASE_URL}/api/quiz/score/${encodeURIComponent(userName)}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get quiz score')
    }

    const result: ApiResponse<QuizScoreResponse> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to get quiz score')
    }

    return result.data
  },

  async getCombinedScore(userName: string): Promise<CombinedScore> {
    const response = await fetch(`${API_BASE_URL}/api/combined-score/${encodeURIComponent(userName)}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get combined score')
    }

    const result: ApiResponse<CombinedScore> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to get combined score')
    }

    return result.data
  },

  async getScoreboard(): Promise<ScoreboardResponse> {
    const response = await fetch(`${API_BASE_URL}/api/scoreboard`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get scoreboard')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || 'Failed to get scoreboard')
    }

    return {
      hasAdminAnswers: result.hasAdminAnswers || false,
      data: result.data || []
    }
  },

  async setQuizCorrectAnswers(answers: Record<string, string>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/admin/quiz-answers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to set quiz correct answers')
    }
  },

  async setCorrectAnswers(answers: Record<string, string>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/admin/set-correct-answers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to set correct answers')
    }
  },

  async getAdminQuizQuestions(): Promise<AdminQuizQuestion[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/quiz-questions`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get quiz questions')
    }

    const result: ApiResponse<AdminQuizQuestion[]> = await response.json()
    return result.data || []
  },

  async getVersion(): Promise<{ backend: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/api/version`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to get version')
    }

    return await response.json()
  },
}

export type { QuizQuestion, QuizAnswerResponse, QuizScoreResponse, CombinedScore, ScoreboardEntry, ScoreboardResponse, AdminQuizQuestion }
