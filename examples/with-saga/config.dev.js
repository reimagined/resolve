const devConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: {
    default: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  }
}

export default devConfig
