import { actionTypes } from 'resolve-redux'

import {
  commandTypes,
  resolverNames,
  defaultReducerName,
  defaultReadModelName,
  defaultAggregateName
} from '../../common/constants'

const { createComment, updateComment, removeComment } = commandTypes

const {
  SEND_COMMAND_SUCCESS,
  LOAD_READMODEL_STATE_SUCCESS,
  CONNECT_READMODEL,
  DISCONNECT_READMODEL
} = actionTypes

const createOptimisticCommentsReducer = ({
  aggregateName = defaultAggregateName,
  readModelName = defaultReadModelName
}) => (state = {}, action) => {
  if (
    action.type === CONNECT_READMODEL &&
    action.readModelName === readModelName &&
    action.resolverName === resolverNames.ReadCommentsTree
  ) {
    return {
      ...state,
      [action.resolverArgs.treeId]: {
        [action.resolverArgs.parentCommentId]: {
          children: []
        }
      }
    }
  }

  if (
    action.type === DISCONNECT_READMODEL &&
    action.readModelName === readModelName &&
    action.resolverName === resolverNames.ReadCommentsTree
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
    return nextState
  }

  if (
    action.type === LOAD_READMODEL_STATE_SUCCESS &&
    action.readModelName === readModelName &&
    action.resolverName === resolverNames.ReadCommentsTree
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
    action.commandType === createComment
  ) {
    return {
      ...state,
      [action.aggregateId]: {
        ...state[action.aggregateId],
        [action.payload.parentCommentId]: {
          ...state[action.aggregateId][action.payload.parentCommentId],
          children: [
            ...state[action.aggregateId][action.payload.parentCommentId]
              .children,
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
          ].children.map(
            child =>
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

export default createOptimisticCommentsReducer
