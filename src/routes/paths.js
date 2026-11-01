// ----------------------------------------------------------------------

/** Lesson keys are "<topic>.<name>" — the URL only carries <name>. */
export const lessonSlug = (key) => key.split('.').slice(1).join('.');

export const paths = {
  home: '/',
  login: (next) => (next ? `/login?next=${encodeURIComponent(next)}` : '/login'),
  me: '/me',
  admin: '/admin',
  topic: (topic) => `/${topic}`,
  lesson: (topic, lessonKey) => `/${topic}/${lessonSlug(lessonKey)}`,
  quiz: (topic, lessonKey) =>
    lessonKey ? `/${topic}/quiz?lesson=${encodeURIComponent(lessonKey)}` : `/${topic}/quiz`,
};
