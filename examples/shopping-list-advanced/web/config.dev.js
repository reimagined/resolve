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
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models.db'
      }
    }
  ]
}

module.exports = devConfig
