const appConfig = {
  aggregates: [
    {
      name: 'Story',
      commands: 'common/aggregates/story.commands.js',
      projection: 'common/aggregates/story.projection.js'
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  readModels: [
    {
      name: 'HackerNews',
      projection: 'common/read-models/hacker-news.projection.js',
      resolvers: 'common/read-models/hacker-news.resolvers.js',
      connectorName: 'hackerNews'
    },
    {
      name: 'Search',
      projection: 'common/read-models/search.projection.js',
      resolvers: 'common/read-models/search.resolvers.js',
      connectorName: 'elasticSearch'
    }
  ],
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'common/sagas/user-confirmation.saga.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ],
  apiHandlers: [
    {
      path: '/api/event-broker/status-all',
      controller: 'common/api-handlers/event-broker-status-all.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/status',
      controller: 'common/api-handlers/event-broker-status.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/pause',
      controller: 'common/api-handlers/event-broker-pause.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/resume',
      controller: 'common/api-handlers/event-broker-resume.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/list-properties',
      controller: 'common/api-handlers/event-broker-list-properties.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/get-property',
      controller: 'common/api-handlers/event-broker-get-property.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/set-property',
      controller: 'common/api-handlers/event-broker-set-property.js',
      method: 'GET'
    },
    {
      path: '/api/event-broker/delete-property',
      controller: 'common/api-handlers/event-broker-delete-property.js',
      method: 'GET'
    }
  ]
}

export default appConfig
