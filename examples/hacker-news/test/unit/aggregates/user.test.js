import '../../../common/aggregates';
import user from '../../../common/aggregates/user';
import { USER_CREATED } from '../../../common/events';

describe('aggregates', () => {
  describe('user', () => {
    it('command "createUser" should create an event to create a user', () => {
      const name = 'SomeName';

      const state = {};
      const command = {
        payload: {
          name
        }
      };

      const event = user.commands.createUser(state, command);

      expect(event).toEqual({ type: USER_CREATED, payload: { name } });
    });

    it('command "createUser" should throw Error "User already exists"', () => {
      const name = 'SomeName';

      const state = {
        createdAt: Date.now()
      };
      const command = {
        payload: {
          name
        }
      };

      expect(() => user.commands.createUser(state, command)).toThrowError(
        'User already exists'
      );
    });

    it('command "createUser" should throw Error "The name field is required"', () => {
      const name = undefined;

      const state = {};
      const command = {
        payload: {
          name
        }
      };

      expect(() => user.commands.createUser(state, command)).toThrowError(
        'The "name" field is required'
      );
    });

    it('eventHandler "USER_CREATED" should set new user to state', () => {
      const createdAt = Date.now();

      const state = user.initialState;
      const event = {
        timestamp: createdAt
      };
      const nextState = {
        createdAt
      };

      expect(user.projection[USER_CREATED](state, event)).toEqual(nextState);
    });
  });
});
