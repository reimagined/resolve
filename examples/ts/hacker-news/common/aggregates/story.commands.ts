import urlLib from 'url'
import jsonwebtoken from 'jsonwebtoken'
import { Aggregate } from '@resolve-js/core'

import validate from './validation'
import { STORY_CREATED, STORY_UNVOTED, STORY_UPVOTED } from '../event-types'
import jwtSecret from '../../auth/jwt-secret'

type User = {
  id: string
  name: string
}

const storyCommands: Aggregate = {
  createStory: (state, command, { jwt: token }) => {
    const jwt = jsonwebtoken.verify(token, jwtSecret) as User

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
        userName: jwt.name,
      },
    }
  },

  upvoteStory: (state, command, { jwt: token }) => {
    const jwt = jsonwebtoken.verify(token, jwtSecret) as User

    validate.fieldRequired(jwt, 'id')
    validate.stateExists(state, 'Story')
    validate.itemIsNotInArray(state.voted, jwt.id, 'User already voted')

    return {
      type: STORY_UPVOTED,
      payload: {
        userId: jwt.id,
      },
    }
  },

  unvoteStory: (state, command, { jwt: token }) => {
    const jwt = jsonwebtoken.verify(token, jwtSecret) as User

    validate.fieldRequired(jwt, 'id')
    validate.stateExists(state, 'Story')
    validate.itemIsInArray(state.voted, jwt.id, 'User did not vote')

    return {
      type: STORY_UNVOTED,
      payload: {
        userId: jwt.id,
      },
    }
  },
}

export default storyCommands
