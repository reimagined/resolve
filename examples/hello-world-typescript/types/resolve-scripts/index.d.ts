declare module 'resolve-scripts' {
  export const defaultResolveConfig: any
  export function declareRuntimeEnv(...args: any[]): any
  export function build(...args: any[]): any
  export function start(...args: any[]): any
  export function watch(...args: any[]): any
  export function runTestcafe(...args: any[]): any
  export function merge(...args: any[]): any
}
