declare module 'mysql2' {
  export const escape: (val: string) => string
  export const escapeId: (val: string) => string
}

declare module 'mysql2/promise' {
  const module: any

  export default module
}
