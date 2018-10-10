import * as defaults from './defaults'

const injectDefaultOptions = callback => (
  {
    aggregateName = defaults.aggregateName,
    readModelName = defaults.readModelName,
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
      allCommentsPaginate = defaults.allCommentsPaginate
    } = {},
    ...options
  } = {},
  ...args
) =>
  callback(
    {
      aggregateName,
      readModelName,
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
        allCommentsPaginate
      },
      ...options
    },
    ...args
  )

export default injectDefaultOptions
