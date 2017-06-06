import { put, call } from 'redux-saga/effects';
import checkRequiredFields from './warn_util';

export default function* sendCommandSaga({ sendCommand }, action) {
    const { command, aggregateId, aggregateName, payload } = action;

    if (
        command &&
        checkRequiredFields(
            { aggregateId, aggregateName },
            'Send command error:',
            JSON.stringify(action)
        )
    ) {
        return;
    }

    try {
        yield call(sendCommand, {
            type: command.type,
            aggregateId,
            aggregateName,
            payload
        });
    } catch (error) {
        const errorAction = Object.keys(action).reduce(
            (result, field) =>
                field === 'command' ? result : { ...result, [field]: action[field] },
            { status: 'error', error }
        );

        yield put(errorAction);
    }
}
