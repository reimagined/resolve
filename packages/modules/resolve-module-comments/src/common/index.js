import createCommentsCommands from './aggregates/comments.commands'
import createCommentsProjection from './read-models/comments.projection'
import createCommentsResolvers from './read-models/comments.resolvers'
import injectDefaults from './inject-defaults'

import {
  defaults,
  CommentsNotificationRenderless,
  CommentsTreeRenderless,
  CommentsPaginateRenderless,
  RefreshHelperRenderless,
  createCommentsReducer
} from '../client'

export {
  defaults,
  CommentsNotificationRenderless,
  CommentsTreeRenderless,
  CommentsPaginateRenderless,
  RefreshHelperRenderless,
  createCommentsReducer,
  createCommentsCommands,
  createCommentsProjection,
  createCommentsResolvers
}

export default ({
  aggregateName,
  readModelName,
  readModelConnectorName,
  commentsTableName,
  reducerName,
  eventTypes,
  commandTypes,
  resolverNames,
  maxNestedLevel,
  verifyCommand
} = {}) => {
  const options = {
    aggregateName,
    readModelName,
    readModelConnectorName,
    commentsTableName,
    reducerName,
    eventTypes,
    commandTypes,
    resolverNames,
    maxNestedLevel
  }
  const imports = {
    verifyCommand:
      verifyCommand ||
      'resolve-module-comments/lib/common/aggregates/verify-command.js'
  }

  return injectDefaults((options, imports) => ({
    aggregates: [
      {
        name: options.aggregateName,
        commands: {
          module:
            'resolve-module-comments/lib/common/aggregates/comments.commands.js',
          options,
          imports
        }
      }
    ],
    readModels: [
      {
        name: options.readModelName,
        connectorName: options.readModelConnectorName,
        projection: {
          module:
            'resolve-module-comments/lib/common/read-models/comments.projection.js',
          options,
          imports
        },
        resolvers: {
          module:
            'resolve-module-comments/lib/common/read-models/comments.resolvers.js',
          options,
          imports
        }
      }
    ],
    redux: {
      reducers: {
        [options.reducerName]: {
          module: 'resolve-module-comments/lib/client/reducers/comments.js',
          options,
          imports
        }
      }
    }
  }))(options, imports)
}
