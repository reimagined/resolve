declare module 'global/window' {
  interface Window {
    location?: {
      protocol?: string
      hostname?: string
      port?: string
    } | string
    clearTimeout?: (timeout: number) => void
    setTimeout?: (handle: Function, ms: number) => number
  }

  const _default: Window

  export default _default
}
