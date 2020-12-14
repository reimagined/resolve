export const createSafeHandler = <T extends Array<any>>(
  fn: (...args: T) => Promise<void>
) => async (...args: T): Promise<void> => {
  try {
    await fn(...args)
  } catch (e) {}
}
