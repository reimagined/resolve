const appConfig = {
  apiHandlers: [
    {
      handler: {
        module: {
          package: '@resolve-js/runtime',
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
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],

    [
      'client/ssr.tsx',
      {
        outputFile: 'common/local-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}

export default appConfig
