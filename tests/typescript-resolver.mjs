export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (!['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'].includes(error?.code) || !specifier.startsWith('.')) throw error
    for (const suffix of ['.ts', '/index.ts']) {
      try {
        return await nextResolve(new URL(`${specifier}${suffix}`, context.parentURL).href, context)
      } catch (nestedError) {
        if (!['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'].includes(nestedError?.code)) throw nestedError
      }
    }
    throw error
  }
}
