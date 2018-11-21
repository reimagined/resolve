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
  ]
}

export default prodConfig
