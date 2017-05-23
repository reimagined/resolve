import { put, call } from 'redux-saga/effects';

export default function* sendCommandSaga({ sendCommand }, { ...action }) {
    const { command, aggregateId, aggregateName, payload } = action;

    if (command && aggregateId && aggregateName) {
        delete action.command;
        try {
            const response = yield call(sendCommand, {
                type: command.type,
                aggregateId,
                aggregateName,
                payload
            });
            action.status = 'success';
            action.response = response;
        } catch (error) {
            action.status = 'error';
            action.error = error;
        }
        yield put(action);
    }
}
