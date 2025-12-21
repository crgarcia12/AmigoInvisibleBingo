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
}
