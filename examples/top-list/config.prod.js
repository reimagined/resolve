const prodConfig = {
  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default prodConfig
