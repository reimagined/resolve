import { createActions } from 'resolve-redux'
import createCommentReducer from 'resolve-module-comments/lib/client/reducers/comments'

import optimisticReducer from './reducers/optimistic'
import optimisticVotingSaga from './sagas/optimistic-voting-saga'
import storyCreateSaga from './sagas/story-create-saga'

const getRedux = (importProvider, commentsInstanceName) => {
  const commentsOptions = importProvider[commentsInstanceName]()
  const aggregateActions = [
    {
      name: 'Story',
      commands: { createStory() {}, upvoteStory() {}, unvoteStory() {} }
    },
    {
      name: 'User',
      commands: { createUser() {}, confirmUser() {}, rejectUser() {} }
    },
    {
      name: commentsOptions.aggregateName,
      commands: {
        [commentsOptions.createComment]() {},
        [commentsOptions.updateComment]() {},
        [commentsOptions.removeComment]() {}
      }
    }
  ].reduce((acc, aggregate) => Object.assign(acc, createActions(aggregate)), {})

  const redux = {
    aggregateActions,
    reducers: {
      comments: createCommentReducer({
        aggregateName: commentsOptions.aggregateName,
        readModelName: commentsOptions.readModelName,
        resolverNames: {
          commentsTree: commentsOptions.commentsTree
        },
        commandTypes: {
          createComment: commentsOptions.createComment,
          updateComment: commentsOptions.updateComment,
          removeComment: commentsOptions.removeComment
        }
      }),
      optimistic: optimisticReducer
    },
    sagas: [optimisticVotingSaga, storyCreateSaga],
    middlewares: [],
    enhancers: []
  }

  return redux
}

export default getRedux
