const devConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default devConfig
