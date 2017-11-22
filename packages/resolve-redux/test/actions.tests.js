import { expect } from 'chai';
import actions, { MERGE_STATE, SEND_COMMAND } from '../src/actions';

describe('actions', () => {
    describe('mergeState', () => {
        it('should create an action to merge reducer state with viewModel state', () => {
            const viewModel = 'counter';
            const state = {
                value: 10
            };
            expect(actions.mergeState(viewModel, state)).to.deep.equal({
                type: MERGE_STATE,
                viewModel,
                state
            });
        });
    });

    describe('sendCommand', () => {
        it('should create an action to send command', () => {
            const command = {
                name: 'create'
            };
            const aggregateId = 'aggregateId';
            const aggregateName = 'aggregateName';
            const payload = {
                value: 42
            };
            expect(
                actions.sendCommand({
                    command,
                    aggregateId,
                    aggregateName,
                    payload
                })
            ).to.deep.equal({
                type: SEND_COMMAND,
                command,
                aggregateId,
                aggregateName,
                payload
            });
        });
    });
});
