import { z } from 'zod'

/**
 * Tiny helper to parse FormData with a Zod schema.
 * Keep it explicit and AI-friendly.
 */
export function parseFormData<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T,
): z.infer<T> {
  // Only string fields for now (files are ignored)
  const obj: Record<string, any> = {}
  for (const [k, v] of formData.entries()) {
    if (typeof v === 'string') obj[k] = v
  }
  return schema.parse(obj)
}
