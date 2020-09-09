const appConfig = {
  clientEntries: [
    [
      'client/main.ts',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}

export default appConfig
