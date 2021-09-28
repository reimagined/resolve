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
    {
      name: 'saga-test',
      commands: 'common/aggregates/saga-test.commands.js',
      projection: 'common/aggregates/saga-test.projection.js',
    },
    {
      name: 'scheduler-test',
      commands: 'common/aggregates/scheduler-test.commands.js',
      projection: 'common/aggregates/scheduler-test.projection.js',
    },
    {
      name: 'monitoring-aggregate',
      commands: 'common/aggregates/monitoring.commands.js',
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
    {
      name: 'saga-tests',
      projection: 'common/read-models/saga-tests.projection.js',
      resolvers: 'common/read-models/saga-tests.resolvers.js',
      connectorName: 'default',
    },
    {
      name: 'scheduler-tests',
      projection: 'common/read-models/saga-scheduler-tests.projection.js',
      resolvers: 'common/read-models/saga-scheduler-tests.resolvers.js',
      connectorName: 'default',
    },
    {
      name: 'init-failed',
      projection: 'common/read-models/init-failed.projection.js',
      resolvers: 'common/read-models/init-failed.resolvers.js',
      connectorName: 'default',
    },
    {
      name: 'monitoring',
      projection: 'common/read-models/monitoring.projection.js',
      resolvers: 'common/read-models/monitoring.resolvers.js',
      connectorName: 'default',
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
    {
      name: 'custom-aggregate-ids',
      projection: 'common/view-models/custom-aggregate-ids.projection.js',
      resolver: 'common/view-models/custom-aggregate-ids.resolver.js',
    },
    {
      name: 'monitoring-view-model',
      projection: 'common/view-models/monitoring.projection.js',
      resolver: 'common/view-models/monitoring.resolver.js',
    },
    {
      name: 'init-failed-view-model',
      projection: 'common/view-models/init-failed.projection.js',
    },
    {
      name: 'resolver-failed-view-model',
      projection: 'common/view-models/resolver-failed.projection.js',
      resolver: 'common/view-models/resolver-failed.resolver.js',
    },
  ],
  sagas: [
    {
      name: 'saga-test-saga',
      source: 'common/sagas/saga-test-saga.js',
      connectorName: 'default',
    },
    {
      name: 'saga-test-scheduler',
      source: 'common/sagas/saga-test-scheduler.js',
      connectorName: 'default',
    },
  ],
  clientImports: {
    appOptions: {
      package: '@resolve-js/core',
      import: 'optionsInjector',
    },
  },
  apiHandlers: [
    {
      handler: 'common/api-handlers/fail-api.js',
      path: '/api/fail-api',
      method: 'GET',
    },
    {
      handler: {
        package: '@resolve-js/runtime-single-process',
        import: 'queryIsReadyHandler',
      },
      path: '/api/query-is-ready',
      method: 'GET',
    },
    {
      handler: {
        module: {
          package: '@resolve-js/runtime-base',
          import: 'liveRequireHandler',
        },
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
        module: {
          package: '@resolve-js/runtime-base',
          import: 'liveRequireHandler',
        },
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
        module: {
          package: '@resolve-js/runtime-base',
          import: 'liveRequireHandler',
        },
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
        module: {
          package: '@resolve-js/runtime-base',
          import: 'liveRequireHandler',
        },
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
