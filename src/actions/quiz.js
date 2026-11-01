import { useMemo } from 'react';
import useSWR, { preload } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = { revalidateOnFocus: false, keepPreviousData: true };

export function useTopics() {
  const { data, error, isLoading, mutate } = useSWR(endpoints.topics, fetcher, swrOptions);
  return useMemo(
    () => ({ topics: data ?? [], topicsLoading: isLoading, topicsError: error, retry: mutate }),
    [data, error, isLoading, mutate]
  );
}

export function useTopic(slug) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? endpoints.topic(slug) : null,
    fetcher,
    swrOptions
  );
  return useMemo(
    () => ({
      topic: data?.topic ?? null,
      lessons: data?.lessons ?? [],
      topicLoading: isLoading,
      topicError: error,
      retry: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

/** A map region's profile (centre, former names, symbols, facts); null until tapped or when missing. */
export function usePlace(map, id) {
  const { data, isLoading } = useSWR(map && id ? endpoints.place(map, id) : null, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  });
  return { place: data ?? null, placeLoading: isLoading };
}

export function useTopicStats(slug, refreshKey) {
  const { data } = useSWR(
    slug ? [endpoints.topicStats(slug), { params: { r: refreshKey } }] : null,
    fetcher,
    swrOptions
  );
  return data ?? null;
}

// A swipe-quiz story: questions + neighbouring lessons + family graph, one call.
const deckKey = (topic, lesson) => [
  endpoints.deck,
  { params: { topic, lesson: lesson || undefined } },
];

export function useDeck(topic, lesson) {
  const { data, error, isLoading, mutate } = useSWR(deckKey(topic, lesson), fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  return { deck: data ?? null, deckError: error, deckLoading: isLoading, reloadDeck: mutate };
}

/** Fetch a neighbouring lesson's deck ahead, so swiping to it shows questions, not a spinner. */
export const preloadDeck = (topic, lesson) => preload(deckKey(topic, lesson), fetcher);

// Quiz questions are fetched imperatively: a new random set on every (re)start.
export const fetchQuiz = async ({ topic, lesson, count }) => {
  const res = await axios.get(endpoints.quiz, {
    params: { topic, lesson: lesson || undefined, count },
  });
  return res.data.questions;
};

export const submitAnswer = async (questionId, choice) =>
  (await axios.post(endpoints.answer, { questionId, choice })).data;

export const submitAttempt = async (payload) =>
  (await axios.post(endpoints.attempts, payload)).data;

/** "This question is wrong" — { questionId, reason, suggested?, note?, lang }. */
export const reportQuestion = async (payload) => (await axios.post(endpoints.report, payload)).data;

// ----------------------------------------------------------------------
// Jeopardy

export const fetchJeopardyBoard = async ({ topics, columns }) =>
  (
    await axios.get(endpoints.jeopardy.board, {
      params: { topics: topics?.length ? topics.join(',') : undefined, columns },
    })
  ).data;

/** No `choice` = reveal the answer. A miss never reveals it, so others can steal. */
export const checkJeopardy = async (body) =>
  (await axios.post(endpoints.jeopardy.check, body)).data;

// ----------------------------------------------------------------------
// Signed-in player

export function useAnalysis(enabled) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? endpoints.analysis : null,
    fetcher,
    swrOptions
  );
  return {
    analysis: data ?? null,
    analysisError: error,
    analysisLoading: isLoading,
    retry: mutate,
  };
}

// ----------------------------------------------------------------------
// Admin

export function useAdminTopics(enabled) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? endpoints.admin.topics : null,
    fetcher,
    swrOptions
  );
  return {
    adminTopics: data ?? [],
    adminTopicsError: error,
    adminTopicsLoading: isLoading,
    reload: mutate,
  };
}

export function useAdminQuestions(params, enabled) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? [endpoints.admin.questions, { params }] : null,
    fetcher,
    swrOptions
  );
  return { list: data ?? null, listError: error, listLoading: isLoading, reload: mutate };
}

export function useAdminReports(params, enabled) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? [endpoints.admin.reports, { params }] : null,
    fetcher,
    swrOptions
  );
  return { reports: data ?? null, reportsError: error, reportsLoading: isLoading, reload: mutate };
}

export function useAdminUsers(params, enabled) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? [endpoints.admin.users, { params }] : null,
    fetcher,
    swrOptions
  );
  return { users: data ?? null, usersError: error, usersLoading: isLoading, reload: mutate };
}

export const adminApi = {
  resolveReport: async (id, body) => (await axios.patch(endpoints.admin.report(id), body)).data,
  setUserRole: async (id, role) => (await axios.patch(endpoints.admin.user(id), { role })).data,
  createTopic: async (body) => (await axios.post(endpoints.admin.topics, body)).data,
  updateTopic: async (slug, body) => (await axios.patch(endpoints.admin.topic(slug), body)).data,
  deleteTopic: async (slug) => (await axios.delete(endpoints.admin.topic(slug))).data,
  createLesson: async (body) => (await axios.post(endpoints.admin.lessons, body)).data,
  updateLesson: async (key, body) => (await axios.patch(endpoints.admin.lesson(key), body)).data,
  deleteLesson: async (key) => (await axios.delete(endpoints.admin.lesson(key))).data,
  createQuestion: async (body) => (await axios.post(endpoints.admin.questions, body)).data,
  updateQuestion: async (id, body) => (await axios.patch(endpoints.admin.question(id), body)).data,
  deleteQuestion: async (id) => (await axios.delete(endpoints.admin.question(id))).data,
  bulkQuestions: async (body) => (await axios.post(endpoints.admin.bulk, body)).data,
};
