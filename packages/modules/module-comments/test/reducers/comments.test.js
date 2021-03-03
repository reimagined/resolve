import { internal } from '@resolve-js/redux'

import createCommentsReducer from '../../src/client/reducers/comments'
import {
  aggregateName,
  readModelName,
  commentsTree,
  createComment,
  updateComment,
  removeComment,
} from '../../src/common/defaults'

const {
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
  QUERY_READMODEL_SUCCESS,
  SEND_COMMAND_SUCCESS,
} = internal.actionTypes

describe('reducer "comments"', () => {
  const reducer = createCommentsReducer()

  test('projection "CONNECT_READMODEL" should create initial state', () => {
    const state = {}
    const action = {
      type: CONNECT_READMODEL,
      query: {
        name: readModelName,
        resolver: commentsTree,
        args: {
          treeId: 'treeId',
          parentCommentId: 'parentCommentId',
        },
      },
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: [],
        },
      },
    })
  })

  test('projection "DISCONNECT_READMODEL" should drop state', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: [],
        },
      },
    }
    const action = {
      type: DISCONNECT_READMODEL,
      query: {
        name: readModelName,
        resolver: commentsTree,
        args: {
          treeId: 'treeId',
          parentCommentId: 'parentCommentId',
        },
      },
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({})
  })

  test('projection "LOAD_READMODEL_STATE_SUCCESS" should update state', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: [],
        },
      },
    }
    const action = {
      type: QUERY_READMODEL_SUCCESS,
      query: {
        name: readModelName,
        resolver: commentsTree,
        args: {
          treeId: 'treeId',
          parentCommentId: 'parentCommentId',
        },
      },
      result: {
        data: {
          commentId: 'parentCommentId',
          children: [{ test: true }],
        },
      },
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          commentId: 'parentCommentId',
          children: [{ test: true }],
        },
      },
    })
  })

  test('projection "SEND_COMMAND_SUCCESS, createComment" should create comment', () => {
    const state = {
      treeId: {
        parentCommentId: {
          children: [],
        },
      },
    }
    const action = {
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: createComment,
        aggregateId: 'treeId',
        aggregateName,
        payload: {
          commentId: 'commentId',
          content: {},
          parentCommentId: 'parentCommentId',
        },
      },
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: [
            {
              commentId: 'commentId',
              content: {},
              parentCommentId: 'parentCommentId',
            },
          ],
        },
      },
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
              parentCommentId: 'parentCommentId',
            },
          ],
        },
      },
    }
    const action = {
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: updateComment,
        aggregateId: 'treeId',
        aggregateName,
        payload: {
          commentId: 'commentId',
          content: { test: true },
          parentCommentId: 'parentCommentId',
        },
      },
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: [
            {
              commentId: 'commentId',
              content: { test: true },
              parentCommentId: 'parentCommentId',
            },
          ],
        },
      },
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
              parentCommentId: 'parentCommentId',
            },
          ],
        },
      },
    }
    const action = {
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: removeComment,
        aggregateId: 'treeId',
        aggregateName,
        payload: {
          commentId: 'commentId',
          parentCommentId: 'parentCommentId',
        },
      },
    }

    const nextState = reducer(state, action)

    expect(nextState).toEqual({
      treeId: {
        parentCommentId: {
          children: [],
        },
      },
    })
  })
})
