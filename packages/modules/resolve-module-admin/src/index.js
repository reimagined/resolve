const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: '/api/event-broker/sagas-list',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-sagas-list.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/read-models-list',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-read-models-list.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/pause',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-pause.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/resume',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-resume.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/reset',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-reset.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/list-properties',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-list-properties.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/get-property',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-get-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/set-property',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-set-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/delete-property',
        handler:
          '@reimagined/module-admin/lib/api-handlers/event-broker-delete-property.js',
        method: 'GET',
      },
    ],
  }

  return config
}

export default createModule
