const createModule = () => {
  return {
    apiHandlers: [
      {
        path: '/api/replication-state',
        handler:
          '@resolve-js/module-replication/lib/api-handlers/replication_state.js',
        method: 'GET',
      },
      {
        path: '/api/pause-replication',
        handler:
          '@resolve-js/module-replication/lib/api-handlers/pause_replication.js',
        method: 'POST',
      },
      {
        path: '/api/resume-replication',
        handler:
          '@resolve-js/module-replication/lib/api-handlers/resume_replication.js',
        method: 'POST',
      },
      {
        path: '/api/replicate',
        handler: '@resolve-js/module-replication/lib/api-handlers/replicate.js',
        method: 'POST',
      },
      {
        path: '/api/reset-replication',
        handler:
          '@resolve-js/module-replication/lib/api-handlers/reset_replication.js',
        method: 'POST',
      },
    ],
  }
}

export default createModule
