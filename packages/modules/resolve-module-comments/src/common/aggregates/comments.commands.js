import injectDefaults from '../inject-defaults'

const createCommentsCommands = (
  {
    commandTypes: { createComment, updateComment, removeComment },
    eventTypes: { COMMENT_CREATED, COMMENT_UPDATED, COMMENT_REMOVED }
  },
  { verifyCommand }
) => ({
  [createComment]: async (state, command, jwtToken) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'Comment creation should provide "commentId" field as string'
      )
    }

    if (
      command.payload.authorId == null ||
      command.payload.authorId.constructor !== String
    ) {
      throw new Error(
        'Comment creation should provide "authorId" field as string'
      )
    }

    if (
      command.payload.parentCommentId != null &&
      command.payload.parentCommentId.constructor !== String
    ) {
      throw new Error(
        'Comment creation should provide "parentCommentId" field as string'
      )
    }

    if (command.payload.content == null) {
      throw new Error(
        'Comment creation should provide "content" field as not-null'
      )
    }

    await verifyCommand(state, command, jwtToken)

    return {
      type: COMMENT_CREATED,
      payload: {
        authorId: command.payload.authorId,
        commentId: command.payload.commentId,
        parentCommentId: command.payload.parentCommentId || null,
        content: command.payload.content
      }
    }
  },

  [updateComment]: async (state, command, jwtToken) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'Comment update should provide "commentId" field as string'
      )
    }

    if (
      command.payload.authorId == null ||
      command.payload.authorId.constructor !== String
    ) {
      throw new Error(
        'Comment creation should provide "authorId" field as string'
      )
    }

    if (command.payload.content == null) {
      throw new Error(
        'Comment update should provide "content" field as not-null'
      )
    }

    await verifyCommand(state, command, jwtToken)

    return {
      type: COMMENT_UPDATED,
      payload: {
        authorId: command.payload.authorId,
        commentId: command.payload.commentId,
        content: command.payload.content
      }
    }
  },

  [removeComment]: async (state, command, jwtToken) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'Comment remove should provide "commentId" field as string'
      )
    }

    if (
      command.payload.authorId == null ||
      command.payload.authorId.constructor !== String
    ) {
      throw new Error(
        'Comment creation should provide "authorId" field as string'
      )
    }

    await verifyCommand(state, command, jwtToken)

    return {
      type: COMMENT_REMOVED,
      payload: {
        commentId: command.payload.commentId,
        authorId: command.payload.authorId
      }
    }
  }
})

export default injectDefaults(createCommentsCommands)
