import { expect } from 'chai';
import sinon from 'sinon';
import sendCommandMiddleware from '../src/send_command_middleware';
import { createStore, applyMiddleware } from 'redux';

describe('sendCommandMiddleware', () => {
    it('works correctly with no error returned by the sendCommand function', () => {
        const sendCommand = sinon.spy(() => Promise.resolve());

        const action = {
            type: 'actionType',
            command: {
                type: 'commandType'
            },
            aggregateId: 'aggregateId',
            aggregateName: 'aggregateName',
            payload: {
                some: 'value'
            }
        };

        const middleware = sendCommandMiddleware({ sendCommand });
        const store = createStore(() => {}, {}, applyMiddleware(middleware));
        store.dispatch(action);

        expect(sendCommand.firstCall.args[0]).to.be.deep.equal({
            type: action.command.type,
            aggregateId: action.aggregateId,
            aggregateName: action.aggregateName,
            payload: action.payload
        });
    });

    it('works correctly with an error returned by the sendCommand function', (done) => {
        const reducerSpy = sinon.spy();
        const action = {
            type: 'actionType',
            command: {
                type: 'commandType'
            },
            aggregateId: 'aggregateId',
            aggregateName: 'aggregateName',
            payload: {
                some: 'value'
            }
        };

        const error = 'fail_command_send';

        const sendCommand = () => {
            const promise = new Promise((resolve) => {
                resolve();
            }).then((data) => {
                promise.catch(() => {
                    const errorAction = { ...action };
                    errorAction.command.error = error;
                    expect(reducerSpy.lastCall.args[1]).to.be.deep.equal(errorAction);
                    done();
                });
                throw error;
            });
            return promise;
        };

        const middleware = sendCommandMiddleware({ sendCommand });
        const store = createStore(reducerSpy, {}, applyMiddleware(middleware));
        store.dispatch(action);
    });

    it('dispatch works correctly', () => {
        const testAction = { type: 'testType', value: 'value2' };
        const sendCommand = sinon.spy((cmd, dispatch) => {
            dispatch(testAction);
            return Promise.resolve();
        });

        const reducer = (state, action) =>
            action.type === testAction.type ? { values: [...state.values, action.value] } : state;

        const middleware = sendCommandMiddleware({ sendCommand });
        const store = createStore(reducer, { values: ['value1'] }, applyMiddleware(middleware));

        const command = {
            type: 'actionType',
            command: {
                type: 'commandType'
            },
            aggregateId: 'aggregateId',
            aggregateName: 'aggregateName',
            payload: {
                some: 'value'
            }
        };
        store.dispatch(command);

        expect(store.getState()).to.be.deep.equal({ values: ['value1', 'value2'] });
    });
});
