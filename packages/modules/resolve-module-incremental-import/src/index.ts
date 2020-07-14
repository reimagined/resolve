const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: '/api/incremental-import/freeze',
        handler:
          'resolve-module-incremental-import/lib/api-handlers/freeze.js',
        method: 'POST'
      },
      {
        path: '/api/incremental-import/unfreeze',
        handler:
          'resolve-module-incremental-import/lib/api-handlers/unfreeze.js',
        method: 'POST'
      },
      {
        path: '/api/incremental-import/inject-events',
        handler:
          'resolve-module-incremental-import/lib/api-handlers/inject-events.js',
        method: 'POST'
      }
    ]
  }

  return config
}

export default createModule
