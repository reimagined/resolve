import { SerializableMap } from '@resolve-js/core'

export type HookExecutor<TData extends any[], TResult> = (
  ...data: TData
) => Promise<TResult> | void

export type Resolver = (source: string) => string

export function isCallback<T>(x: any): x is T {
  return x != null && typeof x === 'function'
}
export function isOptions<T>(x: any): x is T {
  return x != null && typeof x === 'object' && !(x instanceof Array)
}
export function isSerializableMap(x: any): x is SerializableMap {
  return x != null && typeof x === 'object' && !(x instanceof Array)
}
export const isDependencies = (x: any): x is any[] => {
  return x != null && x instanceof Array
}
export const isArrayOfStrings = (x: string | string[]): x is string[] => {
  return x != null && x instanceof Array
}
