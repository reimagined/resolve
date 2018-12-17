const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  redux: {
    enhancers: ['client/redux/enhancers/redux-devtools.js']
  },
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-memory',
      options: {}
    }
  ]
}

module.exports = devConfig
