import path from 'path'

import createActions from '../client/actions/comment-actions'
import {
  eventTypes,
  actionTypes,
  commandTypes,
  defaultAggregateName,
  defaultReadModelName
} from './constants'

// Runtime
export { createActions, commandTypes, eventTypes, actionTypes }

// Compile time
export default ({
  aggregateName = defaultAggregateName,
  readModelName = (defaultReadModelName.verifyCommand = path.join(
    __dirname,
    './common/aggregates/verify-command.js'
  ))
} = {}) => {
  const options = {
    aggregateName,
    readModelName
  }
  const imports = {
    verifyCommand
  }

  return {
    aggregates: [
      {
        name: options.aggregateName,
        commands: {
          module: path.join(
            __dirname,
            './common/aggregates/comment.commands.js'
          ),
          options,
          imports
        },
        projection: {
          module: path.join(
            __dirname,
            './common/aggregates/comment.projection.js'
          ),
          options,
          imports
        }
      }
    ],
    readModels: [
      {
        name: options.aggregateName,
        projection: {
          module: path.join(
            __dirname,
            './common/read-models/comments.projection.js'
          ),
          options,
          imports
        },
        resolvers: {
          module: path.join(
            __dirname,
            './common/read-models/comments.resolvers.js'
          ),
          options,
          imports
        }
      }
    ],
    redux: {
      middlewares: [
        {
          module: path.join(
            __dirname,
            '../client/middlewares/optimistic-comments-middleware.js'
          ),
          options,
          imports
        }
      ]
    }
  }
}
