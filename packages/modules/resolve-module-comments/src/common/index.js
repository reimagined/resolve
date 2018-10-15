import path from 'path'

import createCommentsCommands from './aggregates/comments.commands'
import createCommentsProjection from './read-models/comments.projection'
import createCommentsResolvers from './read-models/comments.resolvers'
import injectDefaults from './inject-defaults'

import {
  createCommentsReducer,
  defaults,
  CommentsNotification
} from '../client'

export {
  defaults,
  CommentsNotification,
  createCommentsReducer,
  createCommentsCommands,
  createCommentsProjection,
  createCommentsResolvers
}

export default ({
  aggregateName,
  readModelName,
  readModelAdapter,
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
    readModelAdapter,
    commentsTableName,
    reducerName,
    eventTypes,
    commandTypes,
    resolverNames,
    maxNestedLevel
  }
  const imports = {
    verifyCommand
  }

  return injectDefaults((options, imports) => ({
    aggregates: [
      {
        name: options.aggregateName,
        commands: {
          module: path.join(__dirname, './aggregates/comments.commands.js'),
          options,
          imports
        }
      }
    ],
    readModels: [
      {
        name: options.readModelName,
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
    readModelAdapters: {
      [options.readModelName]: options.readModelAdapter
    },
    redux: {
      reducers: {
        [options.reducerName]: {
          module: path.join(__dirname, '../client/reducers/comments.js'),
          options,
          imports
        }
      }
    }
  }))(options, imports)
}
