const prodConfig = {
  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production',
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default prodConfig
