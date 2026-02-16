export {}

declare global {
  // SSR dehydrate payload
  // Keep it as unknown; client code should validate before use if needed.
  // (We intentionally avoid `any`.)
  var __VITRIO_LOADER_CACHE__: unknown | undefined
  var __VITRIO_FLASH__: unknown | undefined
}
