import { take, put } from 'redux-saga/effects';

export default function* sendCommandSaga({ sendCommand }) {
    while (true) {
        const action = yield take('*');
        const { command, aggregateId, aggregateType, payload } = action;

        if (command && aggregateId && aggregateType) {
            const error = yield sendCommand({
                commandName: command.name,
                aggregateId,
                aggregateType,
                payload
            });

            if (error) {
                yield put(error);
            }
        }
    }
}
