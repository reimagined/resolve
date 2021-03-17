import injectDefaults from '../inject-defaults'

const createCommentsCommands = (
  {
    commandTypes: { createComment, updateComment, removeComment },
    eventTypes: { COMMENT_CREATED, COMMENT_UPDATED, COMMENT_REMOVED },
  },
  { verifyCommand }
) => ({
  [createComment]: async (state, command, { jwt }) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'A "commentId" field of the string type is required when creating a comment'
      )
    }

    if (
      command.payload.authorId == null ||
      command.payload.authorId.constructor !== String
    ) {
      throw new Error(
        'An "authorId" of the string type is required when creating a comment'
      )
    }

    if (
      command.payload.parentCommentId != null &&
      command.payload.parentCommentId.constructor !== String
    ) {
      throw new Error(
        'A "parentCommentId" field of the string type is required when creating a comment'
      )
    }

    if (command.payload.content == null) {
      throw new Error(
        'A non-null "content" field is required when creating a comment'
      )
    }

    await verifyCommand(state, command, jwt)

    return {
      type: COMMENT_CREATED,
      payload: {
        authorId: command.payload.authorId,
        commentId: command.payload.commentId,
        parentCommentId: command.payload.parentCommentId || null,
        content: command.payload.content,
      },
    }
  },

  [updateComment]: async (state, command, { jwt }) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'A "commentId" field of the string type is required when creating a comment'
      )
    }

    if (
      command.payload.authorId == null ||
      command.payload.authorId.constructor !== String
    ) {
      throw new Error(
        'An "authorId" field of the string type is required when creating a comment'
      )
    }

    if (command.payload.content == null) {
      throw new Error(
        'A non-null "content" field is required when updating a comment'
      )
    }

    await verifyCommand(state, command, jwt)

    return {
      type: COMMENT_UPDATED,
      payload: {
        authorId: command.payload.authorId,
        commentId: command.payload.commentId,
        content: command.payload.content,
      },
    }
  },

  [removeComment]: async (state, command, { jwt }) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'A "commentId" field of the string type is required when removing a comment'
      )
    }

    if (
      command.payload.authorId == null ||
      command.payload.authorId.constructor !== String
    ) {
      throw new Error(
        'An "authorId" field of the string type is required when removing a comment'
      )
    }

    await verifyCommand(state, command, jwt)

    return {
      type: COMMENT_REMOVED,
      payload: {
        commentId: command.payload.commentId,
        authorId: command.payload.authorId,
      },
    }
  },
})

export default injectDefaults(createCommentsCommands)
