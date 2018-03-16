import validateConfig from '../utils/validate_config'

export const meta = {
  files: [],
  filesOrModules: []
}

const config = {
  // Subdirectory on HOST:PORT
  rootPath: '',
  // CDN assets
  staticPath: '',
  // Dirs
  staticDir: 'static',
  distDir: 'dist',
  // Files
  /* meta */ @file('routes') routes: 'client/routes.js',
  /* meta */ @file('aggregates') aggregates: 'common/aggregates/index.js',
  /* meta */ @file('readModels') readModels: 'common/read-models/index.js',
  /* meta */ @file('viewModels') viewModels: 'common/view-models/index.js',
  /* meta */ @file('index') index: 'client/index.js',
  /* meta */ @file('auth') auth: 'auth/index.js',
  redux: {
    /* meta */ @file('redux.store') store: 'client/store/index.js',
    /* meta */ @file('redux.reducers') reducers: 'client/reducers/index.js',
    /* meta */ @file('redux.middlewares')
    middlewares: 'client/middlewares/index.js'
  },
  // Adapters
  storage: {
    /* meta */ @fileOrModule('storage.adapter') adapter: 'resolve-storage-lite',
    options: {
      pathToFile: 'storage.txt'
    }
  },
  bus: {
    /* meta */ @fileOrModule('bus.adapter') adapter: 'resolve-bus-memory',
    options: {}
  },
  subscribe: {
    /* meta */ @fileOrModule('subscribe.adapter')
    adapter: 'resolve-redux/dist/subscribe_adapter',
    options: {}
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
  },
  registry: 'https://registry.resolve.coming.soon',
  // Config extensions
  env: {
    test: {
      storage: {
        adapter: 'resolve-storage-lite',
        options: {}
      }
    }
  }
}

validateConfig(config)

export default config

function file(name) {
  meta.files.push(name)
  return obj => obj
}

function fileOrModule(name) {
  meta.filesOrModules.push(name)
  return obj => obj
}

export const decorators = {
  file,
  fileOrModule
}
