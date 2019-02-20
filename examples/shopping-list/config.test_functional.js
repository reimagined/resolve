const testFunctionalConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-lite',
      options: {}
    }
  ],
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default testFunctionalConfig
