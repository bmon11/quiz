import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

/** Login token, kept in localStorage by the auth provider. */
export const TOKEN_KEY = 'trivia-token';

export const readToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? readToken() : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get(url, { ...config });
  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  topics: '/topics',
  topic: (slug) => `/topics/${slug}`,
  topicStats: (slug) => `/topics/${slug}/stats`,
  quiz: '/quiz',
  deck: '/quiz/deck',
  answer: '/quiz/answer',
  report: '/quiz/report',
  jeopardy: { board: '/jeopardy/board', check: '/jeopardy/check' },
  place: (map, id) => `/places/${map}/${id}`,
  attempts: '/attempts',
  auth: {
    me: '/auth/me',
    login: '/auth/login',
    register: '/auth/register',
    google: '/auth/google',
  },
  analysis: '/me/analysis',
  admin: {
    topics: '/admin/topics',
    topic: (slug) => `/admin/topics/${slug}`,
    lessons: '/admin/lessons',
    lesson: (key) => `/admin/lessons/${encodeURIComponent(key)}`,
    questions: '/admin/questions',
    question: (id) => `/admin/questions/${id}`,
    bulk: '/admin/questions/bulk',
    reports: '/admin/reports',
    report: (id) => `/admin/reports/${id}`,
    users: '/admin/users',
    user: (id) => `/admin/users/${id}`,
  },
};
