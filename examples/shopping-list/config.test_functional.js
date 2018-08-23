const testFunctionalConfig = {
  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'development',

  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default testFunctionalConfig
