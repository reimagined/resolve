const testFunctionalConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },

  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default testFunctionalConfig
