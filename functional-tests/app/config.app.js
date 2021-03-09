const appConfig = {
  aggregates: [
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js',
      encryption: 'common/aggregates/encryption.js',
    },
    {
      name: 'Counter',
      commands: 'common/aggregates/counter.commands.js',
    },
    {
      name: 'test-scenario',
      commands: 'common/aggregates/test-scenario.commands.js',
      projection: 'common/aggregates/test-scenario.projection.js',
    },
  ],
  readModels: [
    {
      name: 'users',
      projection: 'common/read-models/users.projection.js',
      resolvers: 'common/read-models/users.resolvers.js',
      connectorName: 'default',
    },
    {
      name: 'personal-data',
      projection: 'common/read-models/personal-data.projection.js',
      resolvers: 'common/read-models/personal-data.resolvers.js',
      connectorName: 'default',
      encryption: 'common/read-models/encryption.js',
    },
    {
      name: 'test-scenarios',
      projection: 'common/read-models/test-scenarios.projection.js',
      resolvers: 'common/read-models/test-scenarios.resolvers.js',
      connectorName: 'default',
      encryption: 'common/read-models/encryption.js',
    },
  ],
  viewModels: [
    {
      name: 'user-profile',
      projection: 'common/view-models/user.projection.js',
      resolver: 'common/view-models/user.resolver.js',
    },
    {
      name: 'custom-serializer',
      projection: 'common/view-models/custom-serializer.projection.js',
      serializeState: 'common/view-models/custom-serializer.serialize.js',
      deserializeState: 'common/view-models/custom-serializer.deserialize.js',
    },
    {
      name: 'counter',
      projection: 'common/view-models/counter.projection.js',
    },
    {
      name: 'cumulative-likes',
      projection: 'common/view-models/cumulative-likes.projection.js',
    },
    {
      name: 'test-scenario-view-model',
      projection: 'common/view-models/test-scenario.projection.js',
      resolver: 'common/view-models/test-scenario.resolver.js',
    },
  ],
  clientImports: {
    version: '@resolve-js/runtime/lib/common/utils/interop-options.js',
  },
  apiHandlers: [
    {
      handler: '@resolve-js/runtime/lib/local/query-is-ready-handler.js',
      path: '/api/query-is-ready',
      method: 'GET',
    },
    {
      handler: {
        module:
          '@resolve-js/runtime/lib/common/handlers/live-require-handler.js',
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
        module:
          '@resolve-js/runtime/lib/common/handlers/live-require-handler.js',
        options: {
          modulePath: './ssr-hoc.js',
          moduleFactoryImport: false,
        },
      },
      path: '/hoc',
      method: 'GET',
    },
    {
      handler: {
        module:
          '@resolve-js/runtime/lib/common/handlers/live-require-handler.js',
        options: {
          modulePath: './ssr-redux-hooks.js',
          moduleFactoryImport: false,
        },
      },
      path: '/redux-hooks/:markup*',
      method: 'GET',
    },
    {
      handler: {
        module:
          '@resolve-js/runtime/lib/common/handlers/live-require-handler.js',
        options: {
          modulePath: './ssr-redux-hooks.js',
          moduleFactoryImport: false,
        },
      },
      path: '/redux-hooks',
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
    'client/index-redux-hooks.js',
    [
      'client/ssr-redux-hooks.js',
      {
        outputFile: 'common/local-entry/ssr-redux-hooks.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
    [
      'client/ssr-redux-hooks.js',
      {
        outputFile: 'common/cloud-entry/ssr-redux-hooks.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}

export default appConfig
