import {
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED
} from '../event_types'
import { createComment, updateComment, removeComment } from '../command_types'

export default (options, imports) => ({
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
      command.payload.parentCommentId !== null &&
      (command.payload.parentCommentId === undefined ||
        command.payload.parentCommentId.constructor !== String)
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

    await imports.verify(state, command, jwtToken, createComment)

    return {
      type: COMMENT_CREATED,
      payload: {
        commentId: command.payload.commentId,
        parentCommentId: command.payload.parentCommentId,
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

    if (command.payload.content == null) {
      throw new Error(
        'Comment update should provide "content" field as not-null'
      )
    }

    await imports.verify(state, command, jwtToken, updateComment)

    return {
      type: COMMENT_UPDATED,
      payload: {
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

    await imports.verify(state, command, jwtToken, removeComment)

    return {
      type: COMMENT_REMOVED,
      payload: {
        commentId: command.payload.commentId
      }
    }
  }
})
