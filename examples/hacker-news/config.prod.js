const prodConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-memory',
      options: {}
    }
  ],
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default prodConfig
