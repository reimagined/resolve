import { declareRuntimeEnv } from 'resolve-scripts'
const EVENTS_VERSION = declareRuntimeEnv('EVENTS_VERSION', '')

const appConfig = {
  aggregates: [
    {
      name: 'user',
      commands: {
        module: 'common/aggregates/user.commands.js',
        options: { VERSION: EVENTS_VERSION },
      },
      projection: {
        module: 'common/aggregates/user.projection.js',
        options: { VERSION: EVENTS_VERSION },
      },
      encryption: 'common/aggregates/encryption.js',
    },
    {
      name: 'Counter',
      commands: {
        module: 'common/aggregates/counter.commands.js',
        options: { VERSION: EVENTS_VERSION },
      },
    },
  ],
  readModels: [
    {
      name: 'users',
      projection: {
        module: 'common/read-models/users.projection.js',
        options: { VERSION: EVENTS_VERSION },
      },
      resolvers: {
        module: 'common/read-models/users.resolvers.js',
        options: { VERSION: EVENTS_VERSION },
      },
      connectorName: 'default',
    },
    {
      name: 'personal-data',
      projection: {
        module: 'common/read-models/personal-data.projection.js',
        options: { VERSION: EVENTS_VERSION },
      },
      resolvers: {
        module: 'common/read-models/personal-data.resolvers.js',
        options: { VERSION: EVENTS_VERSION },
      },
      connectorName: 'default',
      encryption: 'common/read-models/encryption.js',
    },
  ],
  viewModels: [
    {
      name: 'user-profile',
      projection: {
        module: 'common/view-models/user.projection.js',
        options: { VERSION: EVENTS_VERSION },
      },
      resolver: {
        module: 'common/view-models/user.resolver.js',
        options: { VERSION: EVENTS_VERSION },
      },
    },
    {
      name: 'custom-serializer',
      projection: {
        module: 'common/view-models/custom-serializer.projection.js',
        options: { VERSION: EVENTS_VERSION },
      },
      serializeState: 'common/view-models/custom-serializer.serialize.js',
      deserializeState: 'common/view-models/custom-serializer.deserialize.js',
    },
    {
      name: 'counter',
      projection: {
        module: 'common/view-models/counter.projection.js',
        options: { VERSION: EVENTS_VERSION },
      },
      {
        name: 'cumulative-likes',
        projection: {
          module: 'common/view-models/cumulative-likes.projection.js',
          options: { VERSION: EVENTS_VERSION }
        },
      }
    },
  ],
  clientImports: {
    version: {
      module: 'resolve-runtime/lib/common/utils/interop-options.js',
      options: { VERSION: EVENTS_VERSION },
    },
  },
  apiHandlers: [
    {
      handler: 'resolve-runtime/lib/local/query-is-ready-handler.js',
      path: '/api/query-is-ready',
      method: 'GET',
    },
    {
      handler: {
        module: 'resolve-runtime/lib/common/handlers/live-require-handler.js',
        options: {
          modulePath: './ssr-hoc.js',
          moduleFactoryImport: false,
        },
      },
      path: '/hoc/:markup*',
      method: 'GET',
    },
    {
      handler: {
        module: 'resolve-runtime/lib/common/handlers/live-require-handler.js',
        options: {
          modulePath: './ssr-hoc.js',
          moduleFactoryImport: false,
        },
      },
      path: '/hoc',
      method: 'GET',
    },
  ],
  clientEntries: [
    'client/index.js',
    'client/index-hoc.js',
    [
      'client/ssr-hoc.js',
      {
        outputFile: 'common/local-entry/ssr-hoc.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
    [
      'client/ssr-hoc.js',
      {
        outputFile: 'common/cloud-entry/ssr-hoc.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}

export default appConfig
