import { expect } from 'chai';
import { SEND_COMMAND } from '../src/action_types';
import createActions from '../src/create_actions';

describe('createActions', () => {
  it('should create an action from an aggregate to send command', () => {
    const command = {
      type: 'create'
    };
    const aggregateId = 'aggregateId';
    const aggregateName = 'aggregateName';
    const payload = {
      value: 42
    };

    const aggregate = {
      name: aggregateName,
      commands: {
        create: () => {}
      }
    };
    const generatedActions = createActions(aggregate);
    expect(generatedActions.create(aggregateId, payload)).to.deep.equal({
      type: SEND_COMMAND,
      command,
      aggregateId,
      aggregateName,
      payload
    });
  });

  it('should create an action from an aggregate and extend it by extended actions', () => {
    const createCommand = 'create';
    const originalUpdateCommand = 'originalUpdate';
    const originalDeleteCommand = 'originalDelete';

    const aggregateId = 'aggregateId';
    const aggregateName = 'aggregateName';
    const payload = {
      value: 42
    };

    const aggregate = {
      name: aggregateName,
      commands: {
        create: () => {},
        update: () => {}
      }
    };
    const generatedActions = createActions(aggregate, {
      update: () => ({ type: originalUpdateCommand }),
      delete: () => ({ type: originalDeleteCommand })
    });

    expect(generatedActions.create(aggregateId, payload)).to.deep.equal({
      type: SEND_COMMAND,
      command: {
        type: createCommand
      },
      aggregateId,
      aggregateName,
      payload
    });

    expect(generatedActions.update()).to.deep.equal({
      type: originalUpdateCommand
    });

    expect(generatedActions.delete()).to.deep.equal({
      type: originalDeleteCommand
    });
  });
});
