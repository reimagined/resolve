import { put, call } from 'redux-saga/effects';
import { expect } from 'chai';
import sendCommandSaga from '../src/send_command_saga';

describe('sendCommandSaga', () => {
    it('works correctly with no error returned by the sendCommand function', () => {
        const sendCommand = () => {};

        const action = {
            command: {
                type: 'commandType'
            },
            aggregateId: 'aggregateId',
            aggregateName: 'aggregateName',
            payload: {
                some: 'value'
            }
        };

        const generator = sendCommandSaga({ sendCommand }, action);

        const response = 'ok';

        expect(generator.next().value).to.be.deep.equal(
            call(sendCommand, {
                type: action.command.type,
                aggregateId: action.aggregateId,
                aggregateName: action.aggregateName,
                payload: action.payload
            })
        );

        expect(generator.next(response).done).to.be.deep.equal(true);
    });

    it('works correctly with an error returned by the sendCommand function', () => {
        const sendCommand = () => {};

        const action = {
            command: {
                type: 'commandType'
            },
            aggregateId: 'aggregateId',
            aggregateName: 'aggregateName',
            payload: {
                some: 'value'
            }
        };

        const generator = sendCommandSaga({ sendCommand }, action);

        const error = 'Error';

        expect(generator.next().value).to.be.deep.equal(
            call(sendCommand, {
                type: action.command.type,
                aggregateId: action.aggregateId,
                aggregateName: action.aggregateName,
                payload: action.payload
            })
        );

        expect(generator.throw(error).value).to.be.deep.equal(
            put({
                aggregateId: 'aggregateId',
                aggregateName: 'aggregateName',
                payload: {
                    some: 'value'
                },
                error,
                status: 'error'
            })
        );
    });
});
