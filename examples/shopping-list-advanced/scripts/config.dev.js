const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-memory',
      options: {}
    }
  ]
}

module.exports = devConfig
