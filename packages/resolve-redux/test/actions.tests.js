import { expect } from 'chai';
import actions, { MERGE_STATE, SEND_COMMAND, SUBSCRIBE, UNSUBSCRIBE } from '../src/actions';

describe('actions', () => {
    describe('mergeState', () => {
        it('should create an action to merge reducer state with viewModel state', () => {
            const aggregateId = 'aggregateId';
            const viewModel = 'counter';
            const state = {
                value: 10
            };
            expect(actions.mergeState(viewModel, aggregateId, state)).to.deep.equal({
                type: MERGE_STATE,
                aggregateId,
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

    describe('subscribe', () => {
        it('should create an action to subscribe on view model by aggregateId', () => {
            const viewModel = 'counter';
            const aggregateId = 'aggregateId';
            expect(actions.subscribe(viewModel, aggregateId)).to.deep.equal({
                type: SUBSCRIBE,
                viewModel,
                aggregateId
            });
        });
    });

    describe('unsubscribe', () => {
        it('should create an action to unsubscribe on view model by aggregateId', () => {
            const viewModel = 'counter';
            const aggregateId = 'aggregateId';
            expect(actions.unsubscribe(viewModel, aggregateId)).to.deep.equal({
                type: UNSUBSCRIBE,
                viewModel,
                aggregateId
            });
        });
    });
});
