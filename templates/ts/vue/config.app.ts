const appConfig = {
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
