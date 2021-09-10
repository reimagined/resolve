import { STORY_CREATED, STORY_UNVOTED, STORY_UPVOTED } from '../event-types'
const storyProjection = {
  Init: () => ({}),
  [STORY_CREATED]: (state, { timestamp, payload: { userId } }) => ({
    ...state,
    createdAt: timestamp,
    createdBy: userId,
    voted: [],
  }),
  [STORY_UPVOTED]: (state, { payload: { userId } }) => ({
    ...state,
    voted: state.voted.concat(userId),
  }),
  [STORY_UNVOTED]: (state, { payload: { userId } }) => ({
    ...state,
    voted: state.voted.filter((id) => id !== userId),
  }),
}
export default storyProjection
