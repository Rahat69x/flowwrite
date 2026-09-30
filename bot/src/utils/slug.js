/**
 * Generate a clean URL-friendly slug with unique random suffix
 */
export function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base || 'story'}-${randomSuffix}`;
}
