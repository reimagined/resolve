declare module 'query-string' {
  type StringifyOptions = {
    strict?: boolean
    encode?: boolean
    arrayFormat?: 'none' | 'bracket' | 'index'
    sort?: (a: string, b: string) => boolean
  }

  export function stringify(params: any, options: StringifyOptions): boolean
}
