import urlLib from 'url'
import jsonwebtoken from 'jsonwebtoken'

import validate from './validation'
import { STORY_CREATED, STORY_UNVOTED, STORY_UPVOTED } from '../event-types'
import jwtSecret from '../../auth/jwt_secret'

export default {
  createStory: (state, command, jwtToken) => {
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    validate.fieldRequired(jwt, 'id')
    validate.stateIsAbsent(state, 'Story')

    const { title, link, text } = command.payload

    validate.fieldRequired(command.payload, 'title')

    if (!title || (!text && !link)) {
      throw new Error('Enter submit data')
    }

    if (link && !urlLib.parse(link).hostname) {
      throw new Error('Enter valid url')
    }

    return {
      type: STORY_CREATED,
      payload: {
        title,
        text,
        link,
        userId: jwt.id,
        userName: jwt.name
      }
    }
  },

  upvoteStory: (state, command, jwtToken) => {
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    validate.fieldRequired(jwt, 'id')
    validate.stateExists(state, 'Story')
    validate.itemIsNotInArray(state.voted, jwt.id, 'User already voted')

    return {
      type: STORY_UPVOTED,
      payload: {
        userId: jwt.id
      }
    }
  },

  unvoteStory: (state, command, jwtToken) => {
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    validate.fieldRequired(jwt, 'id')
    validate.stateExists(state, 'Story')
    validate.itemIsInArray(state.voted, jwt.id, 'User did not vote')

    return {
      type: STORY_UNVOTED,
      payload: {
        userId: jwt.id
      }
    }
  }
}
