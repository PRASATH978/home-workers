import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// ← Change this to your PC's IP address
const API_URL = 'http://10.148.94.212:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = await SecureStore.getItemAsync('refresh')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
        await SecureStore.setItemAsync('access', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        await SecureStore.deleteItemAsync('access')
        await SecureStore.deleteItemAsync('refresh')
      }
    }
    return Promise.reject(error)
  }
)

export default api
