import { put, call } from 'redux-saga/effects';

export default function* sendCommandSaga({ sendCommand }, { ...action }) {
    const { command, aggregateId, aggregateName, payload } = action;

    if (command && aggregateId && aggregateName) {
        try {
            yield call(sendCommand, {
                type: command.type,
                aggregateId,
                aggregateName,
                payload
            });
        } catch (error) {
            delete action.command;
            action.status = 'error';
            action.error = error;
            yield put(action);
        }
    }
}
