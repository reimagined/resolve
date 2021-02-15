import { Monitoring } from './types/runtime'

export function firstOfType<T>(
  selector: (x: any) => x is T,
  ...vars: any[]
): T | undefined {
  return vars.find((i) => selector(i)) as T
}

const createSafeHandler = <T extends Array<any>>(
  fn: (...args: T) => Promise<void>
) => async (...args: T): Promise<void> => {
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
