const prodConfig = {
  target: 'local',
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

module.exports = prodConfig
