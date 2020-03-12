export type HookExecutor<TData, TResult> = (data: TData) => TResult | void

export function isCallback<T>(x: any): x is T {
  return x && typeof x === 'function'
}
export function isOptions<T>(x: any): x is T {
  return x && typeof x === 'object' && !(x instanceof Array)
}
export const isDependencies = (x: any): x is any[] => {
  return x && x instanceof Array
}
export function firstOfType<T>(
  selector: (x: any) => x is T,
  ...vars: any[]
): T | undefined {
  return vars.find(i => selector(i)) as T
}
