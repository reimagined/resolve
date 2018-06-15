import jwt from 'jsonwebtoken'

import validate from './validation'
import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED
} from '../events'
import jwtSecret from '../../auth/jwtSecret'

export default {
  createStory: (state, command, jwtToken) => {
    const { id: userId, name: userName } = jwt.verify(jwtToken, jwtSecret)
    validate.stateIsAbsent(state, 'Story')

    const { title, link, text } = command.payload

    validate.fieldRequired(command.payload, 'title')

    return {
      type: STORY_CREATED,
      payload: { title, text, link, userId, userName }
    }
  },

  upvoteStory: (state, command, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validate.stateExists(state, 'Story')
    validate.itemIsNotInArray(state.voted, userId, 'User already voted')

    return { type: STORY_UPVOTED, payload: { userId } }
  },

  unvoteStory: (state, command, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validate.stateExists(state, 'Story')
    validate.itemIsInArray(state.voted, userId, 'User did not vote')

    return { type: STORY_UNVOTED, payload: { userId } }
  },

  commentStory: (state, command, jwtToken) => {
    const { id: userId, name: userName } = jwt.verify(jwtToken, jwtSecret)
    validate.stateExists(state, 'Story')

    const { commentId, parentId, text } = command.payload

    validate.fieldRequired(command.payload, 'parentId')
    validate.fieldRequired(command.payload, 'text')
    validate.keyIsNotInObject(
      state.comments,
      commentId,
      'Comment already exists'
    )

    return {
      type: STORY_COMMENTED,
      payload: {
        commentId,
        parentId,
        userId,
        userName,
        text
      }
    }
  }
}
