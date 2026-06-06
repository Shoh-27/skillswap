import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillswap_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('skillswap_token')
      localStorage.removeItem('skillswap_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
}

// ── Profile
export const profileApi = {
  update:      (data)          => api.put('/profile', data),
  addSkill:    (skillId, type) => api.post('/profile/skills', { skill_id: skillId, type }),
  removeSkill: (userSkillId)   => api.delete(`/profile/skills/${userSkillId}`),
}

// ── Skills
export const skillsApi = {
  list: () => api.get('/skills'),
}

// ── Users
export const usersApi = {
  discover: (params = {}) => api.get('/users', { params }),
  show:     (id)          => api.get(`/users/${id}`),
  reviews:  (userId)      => api.get(`/users/${userId}/reviews`),
  progress: (userId)      => api.get(`/users/${userId}/progress`),
}

// ── Connections
export const connectionsApi = {
  list:   (filter, params = {}) => api.get('/connections', { params: { filter, ...params } }),
  send:   (receiverId)          => api.post('/connections', { receiver_id: receiverId }),
  accept: (id)                  => api.put(`/connections/${id}/accept`),
  reject: (id)                  => api.put(`/connections/${id}/reject`),
}

// ── Messages
export const messagesApi = {
  list: (connectionId, params = {}) => api.get(`/connections/${connectionId}/messages`, { params }),
  send: (connectionId, message)     => api.post(`/connections/${connectionId}/messages`, { message }),
}

// ── Sessions
export const sessionsApi = {
  list:     (params = {})        => api.get('/sessions', { params }),
  show:     (id)                 => api.get(`/sessions/${id}`),
  propose:  (connectionId, data) => api.post(`/connections/${connectionId}/sessions`, data),
  confirm:  (id)                 => api.put(`/sessions/${id}/confirm`),
  cancel:   (id)                 => api.put(`/sessions/${id}/cancel`),
  markDone: (id)                 => api.put(`/sessions/${id}/done`),
}

// ── Reviews
export const reviewsApi = {
  create:     (sessionId, data) => api.post(`/sessions/${sessionId}/reviews`, data),
  forSession: (sessionId)       => api.get(`/sessions/${sessionId}/reviews`),
  forUser:    (userId)          => api.get(`/users/${userId}/reviews`),
}

// ── Notifications
export const notificationsApi = {
  list:        (params = {}) => api.get('/notifications', { params }),
  unreadCount: ()            => api.get('/notifications/unread-count'),
  markAsRead:  (id)          => api.put(`/notifications/${id}/read`),
  markAllRead: ()            => api.put('/notifications/read-all'),
  delete:      (id)          => api.delete(`/notifications/${id}`),
}

// ── Group Sessions
export const groupSessionsApi = {
  list:   (params = {}) => api.get('/group-sessions', { params }),
  show:   (id)          => api.get(`/group-sessions/${id}`),
  create: (data)        => api.post('/group-sessions', data),
  join:   (id)          => api.post(`/group-sessions/${id}/join`),
  leave:  (id)          => api.delete(`/group-sessions/${id}/join`),
  start:  (id)          => api.put(`/group-sessions/${id}/start`),
  end:    (id)          => api.put(`/group-sessions/${id}/end`),
  cancel: (id)          => api.put(`/group-sessions/${id}/cancel`),
}

// ── Resources (file/link/note)
const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } }

export const resourcesApi = {
  // 1-to-1 session
  listForSession:   (sessionId)       => api.get(`/sessions/${sessionId}/resources`),
  uploadForSession: (sessionId, data) => api.post(`/sessions/${sessionId}/resources`, data, multipartConfig),

  // Group session
  listForGroup:   (groupId)       => api.get(`/group-sessions/${groupId}/resources`),
  uploadForGroup: (groupId, data) => api.post(`/group-sessions/${groupId}/resources`, data, multipartConfig),

  // Chat (connection) — YANGI
  listForChat:   (connectionId)       => api.get(`/connections/${connectionId}/resources`),
  uploadForChat: (connectionId, data) => api.post(`/connections/${connectionId}/resources`, data, multipartConfig),

  // Delete
  delete: (id) => api.delete(`/resources/${id}`),
}

// ── Progress
export const progressApi = {
  summary:      ()       => api.get('/progress'),
  skills:       ()       => api.get('/progress/skills'),
  achievements: ()       => api.get('/progress/achievements'),
  forUser:      (userId) => api.get(`/users/${userId}/progress`),
}

// ── AI Matching
export const aiApi = {
  matches: (params = {}) => api.get('/ai/matches', { params }),
  refresh: ()            => api.post('/ai/matches/refresh'),
}

// ── Campus (Phase 1)
export const campusApi = {
  pulse:           ()        => api.get('/campus/pulse'),
  today:           ()        => api.get('/campus/today'),
  sessionComplete: (minutes) => api.post('/campus/session-complete', { minutes }),
}

export default api
