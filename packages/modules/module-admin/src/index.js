const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: '/api/event-broker/sagas-list',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-sagas-list.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/read-models-list',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-read-models-list.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/pause',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-pause.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/resume',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-resume.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/reset',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-reset.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/list-properties',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-list-properties.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/get-property',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-get-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/set-property',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-set-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/delete-property',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-broker-delete-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-store/freeze',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-store-freeze-handler.js',
        method: 'GET',
      },
      {
        path: '/api/event-store/unfreeze',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-store-unfreeze-handler.js',
        method: 'GET',
      },
      {
        path: '/api/event-store/import',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-store-import-handler.js',
        method: 'GET',
      },
      {
        path: '/api/event-store/export',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-store-export-handler.js',
        method: 'GET',
      },
      {
        path: '/api/event-store/incremental-import',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/event-store-incremental-import-handler.js',
        method: 'GET',
      },
      {
        path: '/api/system/status',
        handler:
          '@resolve-js/module-admin/lib/api-handlers/system-status-handler.js',
        method: 'GET',
      },
    ],
  }

  return config
}

export default createModule
