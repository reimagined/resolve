import { expect } from 'chai';
import sinon from 'sinon';

import createCommandExecutor from '../src';

describe('resolve-command', () => {
    const AGGREGATE_ID = 'aggregateId';
    const AGGREGATE_NAME = 'aggregateName';
    const brokenStateError = new Error('Broken Error');

    let lastState, eventStore, eventList;

    const aggregates = [
        {
            initialState: {},
            name: AGGREGATE_NAME,
            eventHandlers: {
                SuccessEvent: (state, event) => {
                    lastState = { ...state, value: 42 };
                    return lastState;
                },
                BrokenEvent: (state, event) => {
                    throw brokenStateError;
                }
            },
            commands: {
                emptyCommand: () => ({
                    type: 'EmptyEvent',
                    payload: {}
                }),
                brokenCommand: () => ({
                    type: '', //broken type
                    payload: {}
                })
            }
        }
    ];

    beforeEach(() => {
        lastState = aggregates[0].initialState;
        eventList = [];

        eventStore = {
            getEventsByAggregateId: sinon
                .stub()
                .callsFake((eventTypes, handler) => handler(eventList.shift())),
            saveEvent: sinon.stub().callsFake((event) => {
                eventList.push(event);
            })
        };
    });

    afterEach(() => {
        lastState = null;
        eventStore = null;
        eventList = null;
    });

    it('should success build aggregate state and execute commnand', async () => {
        const executeCommand = createCommandExecutor({ eventStore, aggregates });
        eventList = [{ type: 'SuccessEvent' }];

        const transaction = executeCommand({
            aggregateName: AGGREGATE_NAME,
            aggregateId: AGGREGATE_ID,
            type: 'emptyCommand'
        });

        await transaction;

        expect(lastState).to.be.deep.equal({
            value: 42
        });
    });

    it('should handle rejection on case of failure on building aggregate state', async () => {
        const executeCommand = createCommandExecutor({ eventStore, aggregates });
        eventList = [{ type: 'BrokenEvent' }];

        try {
            const commnand = executeCommand({
                aggregateName: AGGREGATE_NAME,
                aggregateId: AGGREGATE_ID,
                type: 'emptyCommand'
            });

            await commnand;

            return Promise.reject('Test failed');
        } catch (error) {
            expect(error).to.equal(brokenStateError);
        }
    });

    it('should use initialState in case of eventHandlers absence', async () => {
        const aggregate = { ...aggregates[0] };
        delete aggregate.eventHandlers;

        const executeCommand = createCommandExecutor({
            eventStore,
            aggregates: [aggregate]
        });
        eventList = [{ type: 'SuccessEvent' }];

        executeCommand({
            aggregateName: AGGREGATE_NAME,
            aggregateId: AGGREGATE_ID,
            type: 'emptyCommand'
        });

        await Promise.resolve();

        expect(lastState).to.be.equal(aggregate.initialState);
    });

    it('should reject event with type absence', async () => {
        const executeCommand = createCommandExecutor({ eventStore, aggregates });
        eventList = [{ type: 'SuccessEvent' }];

        const transaction = executeCommand({
            aggregateName: AGGREGATE_NAME,
            aggregateId: AGGREGATE_ID,
            type: 'brokenCommand'
        });

        await Promise.resolve();

        try {
            await transaction;
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.equal('event type is required');
        }
    });

    it('should reject command with aggregateId absence', async () => {
        const executeCommand = createCommandExecutor({ eventStore, aggregates });

        try {
            await executeCommand({
                aggregateName: AGGREGATE_NAME,
                aggregateId: null,
                type: 'brokenCommand'
            });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.equal('"aggregateId" argument is required');
        }
    });

    it('should reject command with aggregateName absence', async () => {
        const executeCommand = createCommandExecutor({ eventStore, aggregates });

        try {
            await executeCommand({
                aggregateName: null,
                aggregateId: AGGREGATE_ID,
                type: 'brokenCommand'
            });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.equal('"aggregateName" argument is required');
        }
    });

    it('should reject command with type absence', async () => {
        const executeCommand = createCommandExecutor({ eventStore, aggregates });

        try {
            await executeCommand({
                aggregateName: AGGREGATE_NAME,
                aggregateId: AGGREGATE_ID,
                type: null
            });
            return Promise.reject('Test failed');
        } catch (error) {
            expect(error.message).to.equal('"type" argument is required');
        }
    });

    it('works the same way for different import types', () => {
        expect(createCommandExecutor).to.be.equal(require('../src'));
    });
});
