const appConfig = {
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js'
    },
    {
      name: 'comment',
      commands: 'common/aggregates/comment.commands.js',
      projection: 'common/aggregates/comment.projection.js'
    }
  ],
  readModels: [
    {
      name: 'comments',
      projection: 'common/read-models/comments.projection.js',
      resolvers: 'common/read-models/comments.resolvers.js',
      connectorName: 'default'
    }
  ],
  viewModels: [
    {
      name: 'myViewModel',
      projection: 'common/view-models/my-viewmodel.projection.js',
      serializeState: 'common/view-models/my-viewmodel.serialize_state.js',
      deserializeState: 'common/view-models/my-viewmodel.deserialize_state.js'
    },
    {
      name: 'system',
      projection: 'common/view-models/system.projection.js',
      serializeState: 'common/view-models/system.serialize_state.js',
      deserializeState: 'common/view-models/system.deserialize_state.js'
    }
  ],
  /* viewModels: [
    {
      name: 'view-model-name',
      projection: 'common/view-models/view-model-name.projection.js',
      serializeState: 'common/view-models/view-model-name.serialize_state.js',
      deserializeState:
        'common/view-models/view-model-name.deserialize_state.js'
    }
  ] */
  clientEntries: ['client/index.js']
}

export default appConfig
