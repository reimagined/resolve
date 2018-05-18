import Immutable from 'seamless-immutable'

import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED
} from '../events'

export default {
  name: 'storyDetails',
  projection: {
    Init: () => Immutable({}),
    [STORY_CREATED]: (
      state,
      {
        aggregateId,
        timestamp,
        payload: { title, link, userId, userName, text }
      }
    ) => {
      const type = !link ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

      return Immutable({
        id: aggregateId,
        type,
        title,
        text,
        link,
        commentCount: 0,
        comments: [],
        votes: [],
        createdAt: timestamp,
        createdBy: userId,
        createdByName: userName
      })
    },

    [STORY_UPVOTED]: (state, { payload: { userId } }) =>
      state.update('votes', votes => votes.concat(userId)),

    [STORY_UNVOTED]: (state, { payload: { userId } }) =>
      state.update('votes', votes => votes.filter(id => id !== userId)),

    [STORY_COMMENTED]: (
      state,
      {
        aggregateId,
        timestamp,
        payload: { parentId, userId, userName, commentId, text }
      }
    ) => {
      const parentIndex =
        parentId === aggregateId
          ? -1
          : state.comments.findIndex(({ id }) => id === parentId)

      const level =
        parentIndex === -1 ? 0 : state.comments[parentIndex].level + 1

      const comment = {
        id: commentId,
        parentId,
        level,
        text,
        createdAt: timestamp,
        createdBy: userId,
        createdByName: userName
      }

      const newState = state.update('commentCount', count => count + 1)

      if (parentIndex === -1) {
        return newState.update('comments', comments => comments.concat(comment))
      } else {
        return newState.update('comments', comments =>
          comments
            .slice(0, parentIndex + 1)
            .concat(comment, comments.slice(parentIndex + 1))
        )
      }
    }
  },
  serializeState: state => JSON.stringify(state || {}),
  deserializeState: state => Immutable(JSON.parse(state))
}
