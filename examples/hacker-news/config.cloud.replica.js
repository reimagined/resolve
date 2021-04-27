import cloudCommonConfig from './config.cloud.common'

export default {
  ...cloudCommonConfig,
  distDir: 'dist',
  apiHandlers: [
    {
      path: '/api/replication-state',
      handler: 'common/api-handlers/replication_state.js',
      method: 'GET',
    },
    {
      path: '/api/pause-replication',
      handler: 'common/api-handlers/pause_replication.js',
      method: 'POST',
    },
    {
      path: '/api/resume-replication',
      handler: 'common/api-handlers/resume_replication.js',
      method: 'POST',
    },
    {
      path: '/api/replicate',
      handler: 'common/api-handlers/replicate.js',
      method: 'POST',
    },
    {
      path: '/api/replicated-events',
      handler: 'common/api-handlers/replicated_events.js',
      method: 'GET',
    },
    {
      path: '/api/reset-replication',
      handler: 'common/api-handlers/reset_replication.js',
      method: 'POST',
    },
  ],
}
