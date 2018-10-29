import { actionTypes } from 'resolve-redux'

import createCommentsReducer from '../../src/client/reducers/comments'
import {
  aggregateName,
  readModelName,
  commentsTree,
  createComment,
  updateComment,
  removeComment
} from '../../src/common/defaults'

const {
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
  LOAD_READMODEL_STATE_SUCCESS,
  SEND_COMMAND_SUCCESS
} = actionTypes

describe('reducer "comments"', () => {
  const reducer = createCommentsReducer()

  test('projection "CONNECT_READMODEL" should create initial state', () => {
    const state = {}
    const action = {
      type: CONNECT_READMODEL,
      readModelName: readModelName,
      resolverName: commentsTree,
      resolverArgs: {
        treeId: 'treeId',
        parentCommentId: 'parentCommentId'
      }
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: []
        }
      }
    })
  })

  test('projection "DISCONNECT_READMODEL" should drop state', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: []
        }
      }
    }
    const action = {
      type: DISCONNECT_READMODEL,
      readModelName: readModelName,
      resolverName: commentsTree,
      resolverArgs: {
        treeId: 'treeId',
        parentCommentId: 'parentCommentId'
      }
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({})
  })

  test('projection "LOAD_READMODEL_STATE_SUCCESS" should update state', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: []
        }
      }
    }
    const action = {
      type: LOAD_READMODEL_STATE_SUCCESS,
      readModelName: readModelName,
      resolverName: commentsTree,
      resolverArgs: {
        treeId: 'treeId',
        parentCommentId: 'parentCommentId'
      },
      result: {
        commentId: 'parentCommentId',
        children: [{ test: true }]
      }
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          commentId: 'parentCommentId',
          children: [{ test: true }]
        }
      }
    })
  })

  test('projection "SEND_COMMAND_SUCCESS, createComment" should create comment', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: []
        }
      }
    }
    const action = {
      type: SEND_COMMAND_SUCCESS,
      aggregateId: 'treeId',
      aggregateName,
      commandType: createComment,
      payload: {
        commentId: 'commentId',
        content: {},
        parentCommentId: 'parentCommentId'
      }
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: [
            {
              commentId: 'commentId',
              content: {},
              parentCommentId: 'parentCommentId'
            }
          ]
        }
      }
    })
  })

  test('projection "SEND_COMMAND_SUCCESS, updateComment" should update comment', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: [
            {
              commentId: 'commentId',
              content: {},
              parentCommentId: 'parentCommentId'
            }
          ]
        }
      }
    }
    const action = {
      type: SEND_COMMAND_SUCCESS,
      aggregateId: 'treeId',
      aggregateName,
      commandType: updateComment,
      payload: {
        commentId: 'commentId',
        content: { test: true },
        parentCommentId: 'parentCommentId'
      }
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: [
            {
              commentId: 'commentId',
              content: { test: true },
              parentCommentId: 'parentCommentId'
            }
          ]
        }
      }
    })
  })

  test('projection "SEND_COMMAND_SUCCESS, removeComment" should remove comment', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: [
            {
              commentId: 'commentId',
              content: {},
              parentCommentId: 'parentCommentId'
            }
          ]
        }
      }
    }
    const action = {
      type: SEND_COMMAND_SUCCESS,
      aggregateId: 'treeId',
      aggregateName,
      commandType: removeComment,
      payload: {
        commentId: 'commentId',
        parentCommentId: 'parentCommentId'
      }
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: []
        }
      }
    })
  })
})
