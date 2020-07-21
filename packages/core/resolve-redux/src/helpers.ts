import uuid from 'uuid/v4'

export function isOptions<T>(x: any): x is T {
  return x && typeof x === 'object' && !(x instanceof Array) && !x.success
}
export function isActionCreators<T>(x: any): x is T {
  return x && typeof x === 'object' && typeof x.success === 'function'
}
export const isDependencies = (x: any): x is any[] => {
  return x && x instanceof Array
}
export const generateQueryId = (name: string, resolver: string): string =>
  `${name}-${resolver}-${uuid()}`
