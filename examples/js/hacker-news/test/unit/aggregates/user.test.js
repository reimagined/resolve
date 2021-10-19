import commands from '../../../common/aggregates/user.commands'
import projection from '../../../common/aggregates/user.projection'
import { USER_CREATED } from '../../../common/event-types'
describe('aggregates', () => {
  let commandContext
  describe('user', () => {
    beforeEach(() => {
      commandContext = {
        jwt: 'jwt',
        aggregateVersion: 0,
      }
    })
    it('command "createUser" should create an event to create a user', () => {
      const name = 'SomeName'
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          name,
        },
      }
      const event = commands.createUser(state, command, commandContext)
      expect(event).toEqual({ type: USER_CREATED, payload: { name } })
    })
    it('command "createUser" should throw Error "User already exists"', () => {
      const name = 'SomeName'
      const state = {
        createdAt: Date.now(),
      }
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          name,
        },
      }
      expect(() =>
        commands.createUser(state, command, commandContext)
      ).toThrowError('User already exists')
    })
    it('command "createUser" should throw Error "The name field is required"', () => {
      const name = undefined
      const state = {}
      const command = {
        aggregateId: 'id',
        aggregateName: 'name',
        type: 'type',
        payload: {
          name,
        },
      }
      expect(() =>
        commands.createUser(state, command, commandContext)
      ).toThrowError('The "name" field is required')
    })
    it('eventHandler "USER_CREATED" should set new user to state', () => {
      const createdAt = Date.now()
      const state = projection.Init()
      const event = {
        type: USER_CREATED,
        aggregateId: 'id',
        aggregateName: 'name',
        aggregateVersion: 1,
        timestamp: createdAt,
      }
      const nextState = {
        createdAt,
        confirmed: false,
        rejected: false,
      }
      expect(projection[USER_CREATED](state, event)).toEqual(nextState)
    })
  })
})
