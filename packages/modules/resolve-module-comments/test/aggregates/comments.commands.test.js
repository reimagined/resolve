import createCommentsCommands from '../../src/common/aggregates/comments.commands'
import {
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED,
  createComment,
  updateComment,
  removeComment
} from '../../src/common/defaults'

describe('aggregate "comments"', () => {
  const commands = createCommentsCommands()

  test('command "createComment" should create comment', async () => {
    const state = {}
    const command = {
      payload: {
        authorId: 'authorId',
        commentId: 'commentId',
        parentCommentId: 'parentCommentId',
        content: 'content'
      }
    }

    const event = await commands[createComment](state, command)

    expect(event).toEqual({
      type: COMMENT_CREATED,
      payload: {
        authorId: command.payload.authorId,
        commentId: command.payload.commentId,
        parentCommentId: command.payload.parentCommentId || null,
        content: command.payload.content
      }
    })
  })

  test('command "updateComment" should update comment', async () => {
    const state = {}
    const command = {
      payload: {
        authorId: 'authorId',
        commentId: 'commentId',
        content: 'content'
      }
    }

    const event = await commands[updateComment](state, command)

    expect(event).toEqual({
      type: COMMENT_UPDATED,
      payload: {
        authorId: command.payload.authorId,
        commentId: command.payload.commentId,
        content: command.payload.content
      }
    })
  })

  test('command "removeComment" should remove comment', async () => {
    const state = {}
    const command = {
      payload: {
        authorId: 'authorId',
        commentId: 'commentId'
      }
    }

    const event = await commands[removeComment](state, command)

    expect(event).toEqual({
      type: COMMENT_REMOVED,
      payload: {
        commentId: command.payload.commentId,
        authorId: command.payload.authorId
      }
    })
  })
})
