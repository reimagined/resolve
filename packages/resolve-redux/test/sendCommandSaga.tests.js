/* eslint no-unused-expressions: 0 */
import sinon from 'sinon';
import { take, put } from 'redux-saga/effects';
import { expect } from 'chai';
import sendCommandSaga from '../src/sendCommandSaga';

describe('sendCommandSaga', () => {
    it('works correctly with no error returned by the sendCommand function', () => {
        const sendCommand = sinon.spy();
        const generator = sendCommandSaga({ sendCommand });

        expect(generator.next().value).to.be.deep.equal(take('*'));

        const action = {
            command: {
                name: 'commandName'
            },
            aggregateId: 'aggregateId',
            aggregateType: 'aggregateType',
            payload: {
                some: 'value'
            }
        };

        generator.next(action);

        expect(
            sendCommand.withArgs({
                commandName: action.command.name,
                aggregateId: action.aggregateId,
                aggregateType: action.aggregateType,
                payload: action.payload
            }).calledOnce
        ).to.be.true;

        expect(generator.next().value).to.be.deep.equal(take('*'));
    });

    it('works correctly with an error returned by the sendCommand function', () => {
        const sendCommand = sinon.spy();
        const generator = sendCommandSaga({ sendCommand });

        expect(generator.next().value).to.be.deep.equal(take('*'));

        const action = {
            command: {
                name: 'commandName'
            },
            aggregateId: 'aggregateId',
            aggregateType: 'aggregateType',
            payload: {
                some: 'value'
            }
        };

        generator.next(action);

        expect(
            sendCommand.withArgs({
                commandName: action.command.name,
                aggregateId: action.aggregateId,
                aggregateType: action.aggregateType,
                payload: action.payload
            }).calledOnce
        ).to.be.true;

        const error = {
            type: 'failed'
        };

        expect(generator.next(error).value).to.be.deep.equal(put(error));
    });
});
