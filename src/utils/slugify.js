export function slugify(value) {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || 'item';
}

export async function uniqueSlug(Model, source, ignoreId) {
  const base = slugify(source);
  let slug = base;
  let attempt = 1;

  while (attempt < 40) {
    const existing = await Model.findOne({ slug }).select('_id');
    if (!existing || String(existing._id) === String(ignoreId || '')) {
      return slug;
    }
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}
