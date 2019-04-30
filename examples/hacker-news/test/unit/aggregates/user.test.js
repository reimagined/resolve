import commands from '../../../common/aggregates/user.commands'
import projection from '../../../common/aggregates/user.projection'
import { USER_CREATED } from '../../../common/event-types'

describe('aggregates', () => {
  describe('user', () => {
    it('command "createUser" should create an event to create a user', () => {
      const name = 'SomeName'

      const state = {}
      const command = {
        payload: {
          name
        }
      }

      const event = commands.createUser(state, command)

      expect(event).toEqual({ type: USER_CREATED, payload: { name } })
    })

    it('command "createUser" should throw Error "User already exists"', () => {
      const name = 'SomeName'

      const state = {
        createdAt: Date.now()
      }
      const command = {
        payload: {
          name
        }
      }

      expect(() => commands.createUser(state, command)).toThrowError(
        'User already exists'
      )
    })

    it('command "createUser" should throw Error "The name field is required"', () => {
      const name = undefined

      const state = {}
      const command = {
        payload: {
          name
        }
      }

      expect(() => commands.createUser(state, command)).toThrowError(
        'The "name" field is required'
      )
    })

    it('eventHandler "USER_CREATED" should set new user to state', () => {
      const createdAt = Date.now()

      const state = projection.Init()
      const event = {
        timestamp: createdAt
      }
      const nextState = {
        createdAt,
        confirmed: false,
        rejected: false
      }

      expect(projection[USER_CREATED](state, event)).toEqual(nextState)
    })
  })
})
