import * as defaults from './defaults'
import defaultVerifyCommand from './aggregates/verify-command'

const injectDefaults = callback => (
  {
    aggregateName = defaults.aggregateName,
    readModelName = defaults.readModelName,
    readModelAdapterName = defaults.readModelAdapterName,
    commentsTableName = defaults.commentsTableName,
    reducerName = defaults.reducerName,
    eventTypes: {
      COMMENT_CREATED = defaults.COMMENT_CREATED,
      COMMENT_UPDATED = defaults.COMMENT_UPDATED,
      COMMENT_REMOVED = defaults.COMMENT_REMOVED
    } = {},
    commandTypes: {
      createComment = defaults.createComment,
      updateComment = defaults.updateComment,
      removeComment = defaults.removeComment
    } = {},
    resolverNames: {
      commentsTree = defaults.commentsTree,
      foreignCommentsCount = defaults.foreignCommentsCount,
      allCommentsPaginate = defaults.allCommentsPaginate
    } = {},
    consistencyMode = defaults.causalConsistencyMode,
    ...options
  } = {},
  { verifyCommand = defaultVerifyCommand } = {},
  ...args
) =>
  callback(
    {
      aggregateName,
      readModelName,
      readModelAdapterName,
      commentsTableName,
      reducerName,
      eventTypes: {
        COMMENT_CREATED,
        COMMENT_UPDATED,
        COMMENT_REMOVED
      },
      commandTypes: {
        createComment,
        updateComment,
        removeComment
      },
      resolverNames: {
        commentsTree,
        foreignCommentsCount,
        allCommentsPaginate
      },
      consistencyMode,
      ...options
    },
    { verifyCommand },
    ...args
  )

export default injectDefaults
