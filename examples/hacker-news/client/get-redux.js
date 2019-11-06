import createCommentsReducer from 'resolve-module-comments/lib/client/reducers/comments'

import optimisticReducer from './reducers/optimistic'
import optimisticVotingSaga from './sagas/optimistic-voting-saga'
import storyCreateSaga from './sagas/story-create-saga'

const getRedux = ({ 'comments-hn': getCommentsOptions }) => {
  const {
    reducerName: commentsReducerName,
    ...commentsOptions
  } = getCommentsOptions()
  const redux = {
    reducers: {
      [commentsReducerName]: createCommentsReducer(commentsOptions),
      optimistic: optimisticReducer
    },
    sagas: [optimisticVotingSaga, storyCreateSaga]
  }

  return redux
}

export default getRedux
