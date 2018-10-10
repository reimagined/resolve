import path from 'path'

import {
  DEFAULT_AGGREGATE_NAME,
  DEFAULT_READ_MODEL_NAME,
  DEFAULT_COMMENTS_TABLE_NAME,
  DEFAULT_REDUCER_NAME
} from './constants'

export * from '../client'

export default ({
  aggregateName = DEFAULT_AGGREGATE_NAME,
  readModelName = DEFAULT_READ_MODEL_NAME,
  commentsTableName = DEFAULT_COMMENTS_TABLE_NAME,
  reducerName = DEFAULT_REDUCER_NAME,
  verifyCommand = path.join(__dirname, './aggregates/verify-command.js')
} = {}) => {
  const options = {
    aggregateName,
    readModelName,
    commentsTableName,
    reducerName
  }
  const imports = {
    verifyCommand
  }

  return {
    aggregates: [
      {
        name: options.aggregateName,
        commands: {
          module: path.join(__dirname, './aggregates/comment.commands.js'),
          options,
          imports
        },
        projection: {
          module: path.join(__dirname, './aggregates/comment.projection.js'),
          options,
          imports
        }
      }
    ],
    readModels: [
      {
        name: options.aggregateName,
        projection: {
          module: path.join(__dirname, './read-models/comments.projection.js'),
          options,
          imports
        },
        resolvers: {
          module: path.join(__dirname, './read-models/comments.resolvers.js'),
          options,
          imports
        }
      }
    ],
    redux: {
      reducers: {
        [reducerName]: {
          module: path.join(
            __dirname,
            '../client/reducers/optimistic-comments.js'
          ),
          options,
          imports
        }
      }
    }
  }
}
