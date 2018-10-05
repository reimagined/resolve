const devConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: {
    HackerNews: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  },
  viewModelAdapters: {
    storyDetails: {
      module: 'common/view-models/snapshot_adapter.module.js',
      options: {
        pathToFile: 'snapshot.db',
        bucketSize: 1
      }
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default devConfig
