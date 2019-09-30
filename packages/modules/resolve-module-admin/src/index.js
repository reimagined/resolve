const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: 'event-broker/status-all',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-status-all.js',
        method: 'GET'
      },
      {
        path: 'event-broker/pause',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-pause.js',
        method: 'GET'
      },
      {
        path: 'event-broker/resume',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-resume.js',
        method: 'GET'
      },
      {
        path: 'event-broker/reset',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-reset.js',
        method: 'GET'
      },
      {
        path: 'event-broker/list-properties',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-list-properties.js',
        method: 'GET'
      },
      {
        path: 'event-broker/get-property',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-get-property.js',
        method: 'GET'
      },
      {
        path: 'event-broker/set-property',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-set-property.js',
        method: 'GET'
      },
      {
        path: 'event-broker/delete-property',
        controller:
          'resolve-module-admin/lib/api-handlers/event-broker-delete-property.js',
        method: 'GET'
      }
    ]
  }

  return config
}

export default createModule
