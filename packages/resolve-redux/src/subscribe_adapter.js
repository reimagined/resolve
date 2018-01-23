import socketIOClient from 'socket.io-client';

import { getRootableUrl } from './util';

export default function subscribeAdapter() {
    let onEvent, onDisconnect;

    const socket = socketIOClient(window.location.origin, {
        path: getRootableUrl('/socket/')
    });

    socket.on('event', event => onEvent(JSON.parse(event)));

    socket.on('disconnect', reason => onDisconnect(reason));

    return {
        onEvent(callback) {
            onEvent = callback;
        },
        onDisconnect(callback) {
            onDisconnect = callback;
        },
        setSubscription({ aggregateIds, types }) {
            socket.emit('setSubscription', {
                ids: aggregateIds, // TODO. Fix server-side
                types
            });
        }
    };
}
