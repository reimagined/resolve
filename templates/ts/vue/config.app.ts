const appConfig = {
  apiHandlers: [
    {
      handler: {
        module: {
          package: '@resolve-js/runtime-base',
          import: 'liveRequireHandler',
        },
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
    [
      'client/index.ts',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],

    [
      'client/ssr.ts',
      {
        outputFile: 'common/local-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}

export default appConfig
