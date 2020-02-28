declare module 'global/window' {
  interface Window {
    location?: {
      protocol?: string
      hostname?: string
      port?: string
    } | string
  }

  const _default: Window

  export default _default
}
