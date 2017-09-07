import { expect } from 'chai';
import actions, {
    MERGE_STATE,
    SEND_COMMAND,
    SET_SUBSCRIPTION,
    REPLACE_STATE
} from '../src/actions';

describe('actions', () => {
    describe('mergeState', () => {
        it('should create an action to merge reducer state with readModel state', () => {
            const readModelName = 'counter';
            const state = {
                value: 10
            };
            expect(actions.mergeState(readModelName, state)).to.deep.equal({
                type: MERGE_STATE,
                readModelName,
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

    describe('setSubscription', () => {
        it('should create an action to set event subscription in socket.io connection', () => {
            const eventTypes = ['EVENT_TYPE_1', 'EVENT_TYPE_2'];
            const aggregateIds = ['AGGREGATE_ID_1', 'AGGREGATE_ID_2'];

            expect(actions.setSubscription(eventTypes, aggregateIds)).to.deep.equal({
                type: SET_SUBSCRIPTION,
                types: eventTypes,
                ids: aggregateIds
            });
        });
    });

    describe('replaceState', () => {
        it('should create an action to replace reducer\'s state', () => {
            const readModelName = 'counter';
            const newState = { field: 'test' };

            expect(actions.replaceState(readModelName, newState)).to.deep.equal({
                type: REPLACE_STATE,
                readModelName,
                state: { field: 'test' }
            });
        });
    });
});
