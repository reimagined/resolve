import { expect } from 'chai';
import actions, { MERGE, SEND_COMMAND, FETCH_MORE } from '../src/actions';

describe('actions', () => {
    describe('merge', () => {
        it('should create an action to merge reducer state with projection state', () => {
            const projectionName = 'counter';
            const state = {
                value: 10
            };
            expect(actions.merge(projectionName, state)).to.deep.equal({
                type: MERGE,
                projectionName,
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

    describe('fetchMore', () => {
        it('should create an action to fetch more items from projection state', () => {
            const projectionName = 'counter';
            const query = {
                owner: 'userId-12345'
            };
            expect(actions.fetchMore(projectionName, query)).to.deep.equal({
                type: FETCH_MORE,
                projectionName,
                query
            });
        });
    });
});
