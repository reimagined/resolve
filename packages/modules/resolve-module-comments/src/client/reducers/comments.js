import { actionTypes } from 'resolve-redux'

import injectDefaults from '../../common/inject-defaults'

const {
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
  LOAD_READMODEL_STATE_SUCCESS,
  SEND_COMMAND_SUCCESS
} = actionTypes

const createCommentsReducer = ({
  aggregateName,
  readModelName,
  resolverNames: { commentsTree },
  commandTypes: { createComment, updateComment, removeComment }
}) => (state = {}, action) => {
  if (
    action.type === CONNECT_READMODEL &&
    action.readModelName === readModelName &&
    action.resolverName === commentsTree
  ) {
    return {
      ...state,
      [action.resolverArgs.treeId]: {
        ...state[action.resolverArgs.treeId],
        [action.resolverArgs.parentCommentId]: {
          children: []
        }
      }
    }
  }

  if (
    action.type === DISCONNECT_READMODEL &&
    action.readModelName === readModelName &&
    action.resolverName === commentsTree
  ) {
    const nextState = {
      ...state,
      [action.resolverArgs.treeId]: {
        ...state[action.resolverArgs.treeId]
      }
    }
    delete nextState[action.resolverArgs.treeId][
      action.resolverArgs.parentCommentId
    ]
    if (Object.keys(nextState[action.resolverArgs.treeId]).length === 0) {
      delete nextState[action.resolverArgs.treeId]
    }
    return nextState
  }

  if (
    action.type === LOAD_READMODEL_STATE_SUCCESS &&
    action.readModelName === readModelName &&
    action.resolverName === commentsTree
  ) {
    return {
      ...state,
      [action.resolverArgs.treeId]: {
        ...state[action.resolverArgs.treeId],
        [action.resolverArgs.parentCommentId]: action.result
      }
    }
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.aggregateName === aggregateName &&
    action.commandType === createComment
  ) {
    return {
      ...state,
      [action.aggregateId]: {
        ...state[action.aggregateId],
        [action.payload.parentCommentId]: {
          ...state[action.aggregateId][action.payload.parentCommentId],
          children: [
            ...(
              state[action.aggregateId][action.payload.parentCommentId] || {
                children: []
              }
            ).children,
            action.payload
          ]
        }
      }
    }
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.aggregateName === aggregateName &&
    action.commandType === updateComment
  ) {
    return {
      ...state,
      [action.aggregateId]: {
        ...state[action.aggregateId],
        [action.payload.parentCommentId]: {
          ...state[action.aggregateId][action.payload.parentCommentId],
          children: state[action.aggregateId][
            action.payload.parentCommentId
          ].children.map(child =>
            child.commentId === action.payload.commentId
              ? {
                  ...child,
                  ...action.payload
                }
              : child
          )
        }
      }
    }
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.aggregateName === aggregateName &&
    action.commandType === removeComment
  ) {
    return {
      ...state,
      [action.aggregateId]: {
        ...state[action.aggregateId],
        [action.payload.parentCommentId]: {
          ...state[action.aggregateId][action.payload.parentCommentId],
          children: state[action.aggregateId][
            action.payload.parentCommentId
          ].children.filter(
            child => child.commentId !== action.payload.commentId
          )
        }
      }
    }
  }

  return state
}

export default injectDefaults(createCommentsReducer)
