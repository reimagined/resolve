declare global {
  namespace NodeJS {
    interface Global {
      __non_webpack_require__: {
        (module: string): any
        resolve: (module: string) => string
        cache: {
          [key: string]: {
            exports: any
            filename: string
          }
        }
      }
    }
  }
}

declare module "@babel/runtime/helpers" {

}

export {}
