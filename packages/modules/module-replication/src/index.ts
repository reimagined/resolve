type EndpointDefinition = {
  endpoint: string
  method: 'POST' | 'GET'
}

export const REPLICATION_STATE: EndpointDefinition = {
  endpoint: '/api/replication-state',
  method: 'GET',
}

export const PAUSE_REPLICATION: EndpointDefinition = {
  endpoint: '/api/pause-replication',
  method: 'POST',
}

export const RESUME_REPLICATION: EndpointDefinition = {
  endpoint: '/api/resume-replication',
  method: 'POST',
}

export const REPLICATE: EndpointDefinition = {
  endpoint: '/api/replicate',
  method: 'POST',
}

export const RESET_REPLICATION: EndpointDefinition = {
  endpoint: '/api/reset-replication',
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
    ],
  }
}

export default createModule
