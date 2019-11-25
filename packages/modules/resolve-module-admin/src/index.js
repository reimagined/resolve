const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: '/api/event-broker/sagas-list',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-sagas-list.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/read-models-list',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-read-models-list.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/pause',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-pause.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/resume',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-resume.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/reset',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-reset.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/list-properties',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-list-properties.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/get-property',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-get-property.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/set-property',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-set-property.js',
        method: 'GET'
      },
      {
        path: '/api/event-broker/delete-property',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-delete-property.js',
        method: 'GET'
      }
    ]
  }

  return config
}

export default createModule
