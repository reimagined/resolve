const appConfig = {
  aggregates: [
    {
      name: 'Image',
      commands: 'common/aggregates/image.commands.js',
      projection: 'common/aggregates/image.projection.js',
    },
  ],
  readModels: [
    {
      name: 'Images',
      projection: 'common/read-models/images.projection.js',
      resolvers: 'common/read-models/images.resolvers.js',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      handler: {
        module:
          '@resolve-js/runtime/lib/common/handlers/live-require-handler.js',
        options: {
          modulePath: './ssr.js',
          moduleFactoryImport: false,
        },
      },
      path: '/:markup*',
      method: 'GET',
    },
  ],
  clientEntries: [
    'client/index.js',
    [
      'client/ssr.js',
      {
        outputFile: 'common/local-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
    [
      'client/ssr.js',
      {
        outputFile: 'common/cloud-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}

export default appConfig
