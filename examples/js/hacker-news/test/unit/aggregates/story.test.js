import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'
import sinon from 'sinon'
import commands from '../../../common/aggregates/story.commands'
import projection from '../../../common/aggregates/story.projection'
import {
  STORY_CREATED,
  STORY_UPVOTED,
  STORY_UNVOTED,
} from '../../../common/event-types'
let sandbox
let userId
let commandContext
const token = 'token'
describe('aggregates', () => {
  beforeEach(() => {
    userId = uuid()
    sandbox = sinon.createSandbox()
    commandContext = {
      jwt: token,
      aggregateVersion: 0,
    }
    jwt.verify = sandbox.stub().returns({ id: userId })
  })
  afterEach(() => {
    sandbox.restore()
  })
  describe('story', () => {
    test('command "createStory" should create an event to create a story', () => {
      const title = 'SomeTitle'
      const text = 'SomeText'
      const link = 'http://SomeLink.test'
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          title,
          text,
          link,
          userId,
        },
      }
      const event = commands.createStory(state, command, commandContext)
      expect(event).toEqual({
        type: STORY_CREATED,
        payload: { title, text, link, userId },
      })
    })
    test('command "createStory" should throw Error "Story already exists"', () => {
      const title = 'SomeTitle'
      const text = 'SomeText'
      const link = 'SomeLink'
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          title,
          text,
          link,
          userId,
        },
      }
      expect(() =>
        commands.createStory(state, command, commandContext)
      ).toThrowError('Story already exists')
    })
    test('command "createStory" should throw Error "The title field is required"', () => {
      const title = undefined
      const text = 'SomeText'
      const link = 'SomeLink'
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          title,
          text,
          link,
          userId,
        },
      }
      expect(() =>
        commands.createStory(state, command, commandContext)
      ).toThrowError('The "title" field is required')
    })
    test('command "createStory" should throw Error "The userId field is required"', () => {
      const title = 'SomeTitle'
      const text = 'SomeText'
      const link = 'SomeLink'
      const userId = undefined
      jwt.verify = sandbox
        .stub()
        .throws(new Error('The "userId" field is required'))
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          title,
          text,
          link,
          userId,
        },
      }
      expect(() =>
        commands.createStory(state, command, commandContext)
      ).toThrow(/The "userId" field is required/)
    })
    test('command "upvoteStory" should create an event to upvote the story', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [],
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      const event = commands.upvoteStory(state, command, commandContext)
      expect(event).toEqual({ type: STORY_UPVOTED, payload: { userId } })
    })
    test('command "upvoteStory" should throw Error "User already voted"', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [userId],
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      expect(() =>
        commands.upvoteStory(state, command, commandContext)
      ).toThrowError('User already voted')
    })
    test('command "upvoteStory" should throw Error "Story does not exist"', () => {
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      expect(() =>
        commands.upvoteStory(state, command, commandContext)
      ).toThrowError('Story does not exist')
    })
    test('command "upvoteStory" should throw Error "The userId field is required"', () => {
      const userId = undefined
      jwt.verify = sandbox
        .stub()
        .throws(new Error('The "userId" field is required'))
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [],
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      expect(() =>
        commands.upvoteStory(state, command, commandContext)
      ).toThrowError(/The "userId" field is required/)
    })
    test('command "unvoteStory" should create an event to unvote the story', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [userId],
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      const event = commands.unvoteStory(state, command, commandContext)
      expect(event).toEqual({ type: STORY_UNVOTED, payload: { userId } })
    })
    test('command "unvoteStory" should throw Error "User did not vote"', () => {
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [],
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      expect(() =>
        commands.unvoteStory(state, command, commandContext)
      ).toThrowError('User did not vote')
    })
    test('command "unvoteStory" should throw Error "Story does not exist"', () => {
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      expect(() =>
        commands.unvoteStory(state, command, commandContext)
      ).toThrowError('Story does not exist')
    })
    test('command "unvoteStory" should throw Error "The userId field is required"', () => {
      const userId = undefined
      jwt.verify = sandbox
        .stub()
        .throws(new Error('The "userId" field is required'))
      const state = {
        createdAt: Date.now(),
        createdBy: userId,
        voted: [userId],
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          userId,
        },
      }
      expect(() =>
        commands.unvoteStory(state, command, commandContext)
      ).toThrowError('The "userId" field is required')
    })
    test('eventHandler "STORY_CREATED" should set createdAt, createdBy and voted to state', () => {
      const createdAt = Date.now()
      const state = {}
      const event = {
        type: STORY_CREATED,
        aggregateId: 'id',
        aggregateName: 'name',
        aggregateVersion: 1,
        timestamp: createdAt,
        payload: {
          userId,
        },
      }
      const nextState = {
        createdAt,
        createdBy: userId,
        voted: [],
      }
      expect(projection[STORY_CREATED](state, event)).toEqual(nextState)
    })
    test('eventHandler "STORY_UPVOTED" should add userId to state.voted', () => {
      const createdAt = Date.now()
      const state = {
        createdAt,
        createdBy: userId,
        voted: [],
      }
      const event = {
        type: STORY_UPVOTED,
        aggregateId: 'id',
        aggregateName: 'name',
        aggregateVersion: 1,
        timestamp: createdAt,
        payload: {
          userId,
        },
      }
      const nextState = {
        createdAt,
        createdBy: userId,
        voted: [userId],
      }
      expect(projection[STORY_UPVOTED](state, event)).toEqual(nextState)
    })
    test('eventHandler "STORY_UNVOTED" should remove userId from state.voted', () => {
      const createdAt = Date.now()
      const state = {
        createdAt,
        createdBy: userId,
        voted: [userId],
      }
      const event = {
        type: STORY_UNVOTED,
        aggregateId: 'id',
        aggregateName: 'name',
        aggregateVersion: 1,
        timestamp: createdAt,
        payload: {
          userId,
        },
      }
      const nextState = {
        createdAt,
        createdBy: userId,
        voted: [],
      }
      expect(projection[STORY_UNVOTED](state, event)).toEqual(nextState)
    })
  })
})
