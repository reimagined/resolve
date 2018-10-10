import path from 'path'

import { eventTypes, commandTypes } from '../constants'

const { COMMENT_CREATED, COMMENT_UPDATED, COMMENT_REMOVED } = eventTypes

const { CREATE_COMMENT, UPDATE_COMMENT, REMOVE_COMMENT } = commandTypes

export default (
  options,
  { verifyCommand = path.join(__dirname, './verify-command.js') }
) => ({
  [CREATE_COMMENT]: async (state, command, jwtToken) => {
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

    await verifyCommand(state, command, jwtToken)

    return {
      type: COMMENT_CREATED,
      payload: {
        commentId: command.payload.commentId,
        parentCommentId: command.payload.parentCommentId,
        content: command.payload.content
      }
    }
  },

  [UPDATE_COMMENT]: async (state, command, jwtToken) => {
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

    await verifyCommand(state, command, jwtToken)

    return {
      type: COMMENT_UPDATED,
      payload: {
        commentId: command.payload.commentId,
        content: command.payload.content
      }
    }
  },

  [REMOVE_COMMENT]: async (state, command, jwtToken) => {
    if (
      command.payload.commentId == null ||
      command.payload.commentId.constructor !== String
    ) {
      throw new Error(
        'Comment remove should provide "commentId" field as string'
      )
    }

    await verifyCommand(state, command, jwtToken)

    return {
      type: COMMENT_REMOVED,
      payload: {
        commentId: command.payload.commentId
      }
    }
  }
})
