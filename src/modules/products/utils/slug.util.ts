export function generateSlug(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return base || 'producto';
}

export function appendSlugSuffix(slug: string, attempt: number): string {
  if (attempt <= 0) return slug;
  return `${slug}-${attempt + 1}`;
}
