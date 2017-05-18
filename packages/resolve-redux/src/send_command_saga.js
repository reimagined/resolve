import { take, put } from 'redux-saga/effects';

export default function* sendCommandSaga({ sendCommand }) {
    while (true) {
        const action = yield take('*');
        const { command, aggregateId, aggregateName, payload } = action;

        if (command && aggregateId && aggregateName) {
            const error = yield sendCommand({
                type: command.type,
                aggregateId,
                aggregateName,
                payload
            });

            if (error) {
                yield put(error);
            }
        }
    }
}
