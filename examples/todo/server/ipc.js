import childProcess from 'child_process';

export default function (modulePath) {
    const ipcProcess = childProcess.fork(modulePath);
    const ipcMessagesMap = {};

    ipcProcess.on('message', (message) => {
        if (!message || !message.id) return;
        ipcMessagesMap[message.id].resolver(message);
    });

    return (payload) => {
        const serialId = Math.floor(Math.random() * 1000000000);

        ipcMessagesMap[serialId] = {};
        ipcMessagesMap[serialId].promise = new Promise((resolve) => {
            ipcMessagesMap[serialId].resolver = resolve;
        });

        ipcProcess.send({ id: serialId, payload });

        return ipcMessagesMap[serialId].promise.then((result) => {
            delete ipcMessagesMap[serialId];
            return result;
        });
    };
}
