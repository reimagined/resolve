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
  createCommentsReducer,
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
  createCommentsResolvers,
}

const makeConfig = (options, imports) => {
  const config = {
    aggregates: [
      {
        name: options.aggregateName,
        commands: {
          module:
            '@resolve-js/module-comments/lib/common/aggregates/comments.commands.js',
          options,
          imports,
        },
      },
    ],
    readModels: [
      {
        name: options.readModelName,
        connectorName: options.readModelConnectorName,
        projection: {
          module:
            '@resolve-js/module-comments/lib/common/read-models/comments.projection.js',
          options,
          imports,
        },
        resolvers: {
          module:
            '@resolve-js/module-comments/lib/common/read-models/comments.resolvers.js',
          options,
          imports,
        },
      },
    ],
    clientImports: {
      [options.commentsInstanceName]: {
        module: {
          package: '@resolve-js/core',
          import: 'optionsInjector',
        },
        options,
      },
    },
    serverImports: {
      [options.commentsInstanceName]: {
        module: {
          package: '@resolve-js/core',
          import: 'optionsInjector',
        },
        options,
      },
    },
  }

  return config
}

const serverEntry = ({
  aggregateName,
  readModelName,
  readModelConnectorName,
  commentsTableName,
  eventTypes,
  commandTypes,
  resolverNames,
  maxNestedLevel,
  verifyCommand,
  commentsInstanceName,
  reducerName,
} = {}) => {
  const options = {
    aggregateName,
    readModelName,
    readModelConnectorName,
    commentsTableName,
    eventTypes,
    commandTypes,
    resolverNames,
    maxNestedLevel,
    commentsInstanceName,
    reducerName,
  }
  const imports = {
    verifyCommand:
      verifyCommand == null
        ? '@resolve-js/module-comments/lib/common/aggregates/verify-command.js'
        : verifyCommand,
  }

  return injectDefaults(makeConfig)(options, imports)
}

export default serverEntry
