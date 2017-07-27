import childProcess from 'child_process';
import uuid from 'uuid';

export default function (modulePath) {
    const ipcProcess = childProcess.fork(modulePath);
    const ipcMessagesMap = {};

    ipcProcess.on('message', (message) => {
        if (!message || !message.id) return;
        ipcMessagesMap[message.id].resolver(message);
    });

    return (payload) => {
        const guid = uuid.v4();

        ipcMessagesMap[guid] = {};
        ipcMessagesMap[guid].promise = new Promise((resolve) => {
            ipcMessagesMap[guid].resolver = resolve;
        });

        ipcProcess.send({ id: guid, payload });

        return ipcMessagesMap[guid].promise.then((result) => {
            delete ipcMessagesMap[guid];
            return result;
        });
    };
}
