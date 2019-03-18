const prodConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
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

export default prodConfig
