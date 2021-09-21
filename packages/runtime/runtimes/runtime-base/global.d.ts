declare global {
  namespace NodeJS {
    interface Global {
      __non_webpack_require__: (module: string) => any
    }
  }
}
export {}
