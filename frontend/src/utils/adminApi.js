import axios from 'axios'

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('admin_user')
      window.location.href = '/admin'
    }
    return Promise.reject(error)
  }
)

export default adminApi
