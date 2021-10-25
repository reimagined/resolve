type EndpointDefinition = {
  endpoint: string
  method: 'POST' | 'GET'
}

export const REPLICATION_STATE: EndpointDefinition = {
  endpoint: '/api/replication/state',
  method: 'GET',
}

export const PAUSE_REPLICATION: EndpointDefinition = {
  endpoint: '/api/replication/pause',
  method: 'POST',
}

export const RESUME_REPLICATION: EndpointDefinition = {
  endpoint: '/api/replication/resume',
  method: 'POST',
}

export const REPLICATE: EndpointDefinition = {
  endpoint: '/api/replication/upload',
  method: 'POST',
}

export const RESET_REPLICATION: EndpointDefinition = {
  endpoint: '/api/replication/reset',
  method: 'POST',
}

export const OCCUPY_REPLICATION: EndpointDefinition = {
  endpoint: '/api/replication/occupy',
  method: 'POST',
}

export const RELEASE_REPLICATION: EndpointDefinition = {
  endpoint: '/api/replication/release',
  method: 'POST',
}

const createModule = () => {
  return {
    apiHandlers: [
      {
        path: REPLICATION_STATE.endpoint,
        handler:
          '@resolve-js/module-replication/lib/api-handlers/replication_state.js',
        method: REPLICATION_STATE.method,
      },
      {
        path: PAUSE_REPLICATION.endpoint,
        handler:
          '@resolve-js/module-replication/lib/api-handlers/pause_replication.js',
        method: PAUSE_REPLICATION.method,
      },
      {
        path: RESUME_REPLICATION.endpoint,
        handler:
          '@resolve-js/module-replication/lib/api-handlers/resume_replication.js',
        method: RESUME_REPLICATION.method,
      },
      {
        path: REPLICATE.endpoint,
        handler: '@resolve-js/module-replication/lib/api-handlers/replicate.js',
        method: REPLICATE.method,
      },
      {
        path: RESET_REPLICATION.endpoint,
        handler:
          '@resolve-js/module-replication/lib/api-handlers/reset_replication.js',
        method: RESET_REPLICATION.method,
      },
      {
        path: OCCUPY_REPLICATION.endpoint,
        handler:
          '@resolve-js/module-replication/lib/api-handlers/occupy_replication.js',
        method: OCCUPY_REPLICATION.method,
      },
      {
        path: RELEASE_REPLICATION.endpoint,
        handler:
          '@resolve-js/module-replication/lib/api-handlers/release_replication.js',
        method: RELEASE_REPLICATION.method,
      },
    ],
  }
}

export default createModule
