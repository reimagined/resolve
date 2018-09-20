import uuid from 'uuid'
import jwt from 'jsonwebtoken'
import sinon from 'sinon'

import commands from '../../../common/aggregates/story.commands'
import projection from '../../../common/aggregates/story.projection'
import {
  STORY_CREATED,
  STORY_UPVOTED,
  STORY_UNVOTED
} from '../../../common/event-types'

let sandbox
let userId
const token = 'token'

describe('aggregates', () => {
  beforeEach(() => {
    userId = uuid.v4()
    sandbox = sinon.createSandbox()
    jwt.verify = sandbox.stub().returns({ id: userId })
  })
  afterEach(() => {
    sandbox.restore()
  })
  describe('story', () => {
    it('command "createStory" should create an event to create a story', () => {
      const title = 'SomeTitle'
      const text = 'SomeText'
      const link = 'http://SomeLink.test'

      const state = {}
      const command = {
        payload: {
          title,
          text,
          link,
          userId
        }
      }

      const event = commands.createStory(state, command, token)

      expect(event).toEqual({
        type: STORY_CREATED,
        payload: { title, text, link, userId }
      })
    })

    it('command "createStory" should throw Error "Story already exists"', () => {
      const title = 'SomeTitle'
      const text = 'SomeText'
      const link = 'SomeLink'

      const state = {
        createdAt: Date.now(),
        createdBy: userId
      }
      const command = {
        payload: {
          title,
          text,
          link,
          userId
        }
      }

      expect(() => commands.createStory(state, command, token)).toThrowError(
        'Story already exists'
      )
    })

    it('command "createStory" should throw Error "The title field is required"', () => {
      const title = undefined
      const text = 'SomeText'
      const link = 'SomeLink'

      const state = {}
      const command = {
        payload: {
          title,
          text,
          link,
          userId
        }
      }

      expect(() => commands.createStory(state, command, token)).toThrowError(
        'The "title" field is required'
      )
    })

    it('command "createStory" should throw Error "The userId field is required"', () => {
      const title = 'SomeTitle'
      const text = 'SomeText'
      const link = 'SomeLink'
      const userId = undefined

      jwt.verify = sandbox
        .stub()
        .throws(new Error('The "userId" field is required'))

      const state = {}
      const command = {
        payload: {
          title,
          text,
          link,
          userId
        }
      }

      expect(() => commands.createStory(state, command, token)).toThrow(
        /The "userId" field is required/
      )
    })

    it('command "upvoteStory" should create an event to upvote the story', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: []
      }
      const command = {
        payload: {
          userId
        }
      }

      const event = commands.upvoteStory(state, command, token)

      expect(event).toEqual({ type: STORY_UPVOTED, payload: { userId } })
    })

    it('command "upvoteStory" should throw Error "User already voted"', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [userId]
      }
      const command = {
        payload: {
          userId
        }
      }

      expect(() => commands.upvoteStory(state, command, token)).toThrowError(
        'User already voted'
      )
    })

    it('command "upvoteStory" should throw Error "Story does not exist"', () => {
      const state = {}
      const command = {
        payload: {
          userId
        }
      }

      expect(() => commands.upvoteStory(state, command, token)).toThrowError(
        'Story does not exist'
      )
    })

    it('command "upvoteStory" should throw Error "The userId field is required"', () => {
      const userId = undefined
      jwt.verify = sandbox
        .stub()
        .throws(new Error('The "userId" field is required'))

      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: []
      }
      const command = {
        payload: {
          userId
        }
      }

      expect(() => commands.upvoteStory(state, command, token)).toThrowError(
        /The "userId" field is required/
      )
    })

    it('command "unvoteStory" should create an event to unvote the story', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [userId]
      }
      const command = {
        payload: {
          userId
        }
      }

      const event = commands.unvoteStory(state, command, token)

      expect(event).toEqual({ type: STORY_UNVOTED, payload: { userId } })
    })

    it('command "unvoteStory" should throw Error "User did not vote"', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: []
      }
      const command = {
        payload: {
          userId
        }
      }

      expect(() => commands.unvoteStory(state, command, token)).toThrowError(
        'User did not vote'
      )
    })

    it('command "unvoteStory" should throw Error "Story does not exist"', () => {
      const state = {}
      const command = {
        payload: {
          userId
        }
      }

      expect(() => commands.unvoteStory(state, command, token)).toThrowError(
        'Story does not exist'
      )
    })

    it('command "unvoteStory" should throw Error "The userId field is required"', () => {
      const userId = undefined
      jwt.verify = sandbox
        .stub()
        .throws(new Error('The "userId" field is required'))

      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [userId]
      }
      const command = {
        payload: {
          userId
        }
      }

      expect(() => commands.unvoteStory(state, command, token)).toThrowError(
        'The "userId" field is required'
      )
    })

    it('eventHandler "STORY_CREATED" should set createdAt, createdBy and voted to state', () => {
      const createdAt = Date.now()

      const state = {}
      const event = {
        timestamp: createdAt,
        payload: {
          userId
        }
      }
      const nextState = {
        createdAt,
        createdBy: userId,
        voted: []
      }

      expect(projection[STORY_CREATED](state, event)).toEqual(nextState)
    })

    it('eventHandler "STORY_UPVOTED" should add userId to state.voted', () => {
      const createdAt = Date.now()

      const state = {
        createdAt,
        createdBy: userId,
        voted: []
      }
      const event = {
        payload: {
          userId
        }
      }
      const nextState = {
        createdAt,
        createdBy: userId,
        voted: [userId]
      }

      expect(projection[STORY_UPVOTED](state, event)).toEqual(nextState)
    })

    it('eventHandler "STORY_UNVOTED" should remove userId from state.voted', () => {
      const createdAt = Date.now()

      const state = {
        createdAt,
        createdBy: userId,
        voted: [userId]
      }
      const event = {
        payload: {
          userId
        }
      }
      const nextState = {
        createdAt,
        createdBy: userId,
        voted: []
      }

      expect(projection[STORY_UNVOTED](state, event)).toEqual(nextState)
    })
  })
})
