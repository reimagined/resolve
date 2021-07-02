import { MiddlewareWrapper, Monitoring } from './types/runtime'

export function firstOfType<T>(
  selector: (x: any) => x is T,
  ...vars: any[]
): T | undefined {
  return vars.find((i) => selector(i)) as T
}

const createSafeHandler = <T extends (...args: any[]) => void>(
  fn: (...args: Parameters<T>) => void
) => (...args: Parameters<T>): void => {
  try {
    fn(...args)
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

export const makeMiddlewareApplier: MiddlewareWrapper = (middlewares) => {
  const reversedMiddlewares = middlewares.slice().reverse()

  return (targetHandler) => {
    let handlersChain = targetHandler
    reversedMiddlewares.forEach(
      (middleware) => (handlersChain = middleware(handlersChain))
    )
    return handlersChain
  }
}
