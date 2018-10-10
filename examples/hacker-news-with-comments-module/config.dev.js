const devConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: {
    HackerNews: {
      module: 'resolve-readmodel-memory',
      options: {}
    },
    Comments: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default devConfig
