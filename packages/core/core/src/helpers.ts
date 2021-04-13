import { Monitoring } from './types/runtime'

export function firstOfType<T>(
  selector: (x: any) => x is T,
  ...vars: any[]
): T | undefined {
  return vars.find((i) => selector(i)) as T
}

const createSafeHandler = <T extends (...args: any[]) => Promise<void>>(
  fn: (...args: Parameters<T>) => Promise<void>
) => async (...args: Parameters<T>): Promise<void> => {
  try {
    await fn(...args)
  } catch (e) {}
}

export const makeMonitoringSafe = (monitoring: Monitoring): Monitoring => {
  return {
    ...monitoring,
    error: monitoring.error
      ? createSafeHandler(monitoring.error)
      : monitoring.error,
  }
}
