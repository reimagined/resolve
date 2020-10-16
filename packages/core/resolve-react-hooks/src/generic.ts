import { SerializableMap } from 'resolve-core'

export type HookExecutor<TData extends any[], TResult> = (
  ...data: TData
) => Promise<TResult> | void

export function isCallback<T>(x: any): x is T {
  return x && typeof x === 'function'
}
export function isOptions<T>(x: any): x is T {
  return x && typeof x === 'object' && !(x instanceof Array)
}
export function isSerializableMap(x: any): x is SerializableMap {
  return x && typeof x === 'object' && !(x instanceof Array)
}
export const isDependencies = (x: any): x is any[] => {
  return x && x instanceof Array
}
