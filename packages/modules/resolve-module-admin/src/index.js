const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: '/api/event-broker/sagas-list',
        handler:
          'resolve-module-admin/lib/api-handlers/event-broker-sagas-list.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/read-models-list',
        handler:
          'resolve-module-admin/lib/api-handlers/event-broker-read-models-list.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/pause',
        handler: 'resolve-module-admin/lib/api-handlers/event-broker-pause.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/resume',
        handler: 'resolve-module-admin/lib/api-handlers/event-broker-resume.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/reset',
        handler: 'resolve-module-admin/lib/api-handlers/event-broker-reset.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/list-properties',
        handler:
          'resolve-module-admin/lib/api-handlers/event-broker-list-properties.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/get-property',
        handler:
          'resolve-module-admin/lib/api-handlers/event-broker-get-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/set-property',
        handler:
          'resolve-module-admin/lib/api-handlers/event-broker-set-property.js',
        method: 'GET',
      },
      {
        path: '/api/event-broker/delete-property',
        handler:
          'resolve-module-admin/lib/api-handlers/event-broker-delete-property.js',
        method: 'GET',
      },
    ],
  }

  return config
}

export default createModule
