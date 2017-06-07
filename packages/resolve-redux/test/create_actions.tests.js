import { expect } from 'chai';
import { SEND_COMMAND } from '../src/actions';
import createActions from '../src/create_actions';

describe('createActions', () => {
    it('should create an action from an aggregate to send command', () => {
        const command = {
            name: 'create'
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
});
