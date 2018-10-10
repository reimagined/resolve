import path from 'path'

import createCommentsCommands from './aggregates/comments.commands'
import createCommentsProjection from './read-models/comments.projection'
import createCommentsResolvers from './read-models/comments.resolvers'
import injectDefaults from './inject-defaults'

export * from '../client'

export {
  createCommentsCommands,
  createCommentsProjection,
  createCommentsResolvers
}

export default ({
  aggregateName,
  readModelName,
  commentsTableName,
  reducerName,
  verifyCommand
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
          module: path.join(__dirname, '../client/reducers/comments.js'),
          options,
          imports
        }
      }
    }
  }))(options, imports)
}
