import { internal } from '@resolve-js/redux'

import injectDefaults from '../../common/inject-defaults'

const {
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
  QUERY_READMODEL_SUCCESS,
  SEND_COMMAND_SUCCESS,
} = internal.actionTypes

const createCommentsReducer = ({
  aggregateName,
  readModelName,
  resolverNames: { commentsTree },
  commandTypes: { createComment, updateComment, removeComment },
}) => (state = {}, action) => {
  if (
    action.type === CONNECT_READMODEL &&
    action.query.name === readModelName &&
    action.query.resolver === commentsTree
  ) {
    return {
      ...state,
      [action.query.args.treeId]: {
        ...state[action.query.args.treeId],
        [action.query.args.parentCommentId]: {
          children: [],
        },
      },
    }
  }

  if (
    action.type === DISCONNECT_READMODEL &&
    action.query.name === readModelName &&
    action.query.resolver === commentsTree
  ) {
    const nextState = {
      ...state,
      [action.query.args.treeId]: {
        ...state[action.query.args.treeId],
      },
    }
    delete nextState[action.query.args.treeId][
      action.query.args.parentCommentId
    ]
    if (Object.keys(nextState[action.query.args.treeId]).length === 0) {
      delete nextState[action.query.args.treeId]
    }
    return nextState
  }

  if (
    action.type === QUERY_READMODEL_SUCCESS &&
    action.query.name === readModelName &&
    action.query.resolver === commentsTree
  ) {
    return {
      ...state,
      [action.query.args.treeId]: {
        ...state[action.query.args.treeId],
        [action.query.args.parentCommentId]: action.result.data,
      },
    }
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.command.aggregateName === aggregateName &&
    action.command.type === createComment
  ) {
    return {
      ...state,
      [action.command.aggregateId]: {
        ...state[action.command.aggregateId],
        [action.command.payload.parentCommentId]: {
          ...state[action.command.aggregateId][
            action.command.payload.parentCommentId
          ],
          children: [
            ...(
              state[action.command.aggregateId][
                action.command.payload.parentCommentId
              ] || {
                children: [],
              }
            ).children,
            action.command.payload,
          ],
        },
      },
    }
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.command.aggregateName === aggregateName &&
    action.command.type === updateComment
  ) {
    return {
      ...state,
      [action.command.aggregateId]: {
        ...state[action.command.aggregateId],
        [action.command.payload.parentCommentId]: {
          ...state[action.command.aggregateId][
            action.command.payload.parentCommentId
          ],
          children: state[action.command.aggregateId][
            action.command.payload.parentCommentId
          ].children.map((child) =>
            child.commentId === action.command.payload.commentId
              ? {
                  ...child,
                  ...action.command.payload,
                }
              : child
          ),
        },
      },
    }
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.command.aggregateName === aggregateName &&
    action.command.type === removeComment
  ) {
    return {
      ...state,
      [action.command.aggregateId]: {
        ...state[action.command.aggregateId],
        [action.command.payload.parentCommentId]: {
          ...state[action.command.aggregateId][
            action.command.payload.parentCommentId
          ],
          children: state[action.command.aggregateId][
            action.command.payload.parentCommentId
          ].children.filter(
            (child) => child.commentId !== action.command.payload.commentId
          ),
        },
      },
    }
  }

  return state
}

export default injectDefaults(createCommentsReducer)
