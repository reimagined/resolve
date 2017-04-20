import { init, attachConsumer, postMessage } from './connector';

export const globalId = '$global';

const publisherFactory = (options) => {
    return init(options).then(() => (event) => {
        postMessage(event, options);
    });
};

const consumerFactory = (options, trigger) => {
    let lastMessageId = 0;
    return init(options).then(() => attachConsumer(
        (message) => {
            if (message.messageId <= lastMessageId) {
                return;
            }
            lastMessageId = message.messageId;
            delete message.messageId;
            trigger(message);
        },
        options
    ));
};

const attachEvent = (callbackMap, eventName, callback) => {
    const callbackArray = callbackMap.get(eventName) || [];
    callbackArray.push(callback);
    callbackMap.set(eventName, callbackArray);
};

const onEventImpl = (eventFunctionsMap, eventDescriptor, callback) => {
    if(Array.isArray(eventDescriptor)) { // Array
        eventDescriptor.forEach(eventName => (
            attachEvent(eventFunctionsMap, eventName, callback)
        ));
    } else if (eventDescriptor && eventDescriptor.toLowerCase) { // String
        attachEvent(eventFunctionsMap, eventDescriptor, callback);
    } else {
        throw new Error('Invalid event descriptor');
    }
}

const localTriggerImpl = (eventFunctionsMap, localChannelName, message) => {
    if (message.$channelName !== undefined &&
        ![localChannelName, globalId].includes(message.$channelName)) {
        return;
    }
    delete message.$channelName;

    const callbacks = eventFunctionsMap.get(message._type);
    if (callbacks) {
        callbacks.forEach(handler => handler(message));
    }
}

const emitEventImpl = (sendFunction, localChannelName, message) => {
    message.$channelName = localChannelName;
    sendFunction(message);
};

const disposeImpl = (options) => {
    const serverProcs = options.managedServerProcs;
    options.managedServerPid = null;
    options.fullStop = true;

    serverProcs.forEach(proc => proc.kill());
};

export default (inputOptions) => {
    const options = Object.assign({}, inputOptions, {
        channelName: inputOptions.channelName || globalId,
        exchangePort: inputOptions.exchangePort || 12999,
        messageTimeout: inputOptions.messageTimeout || 5000,
        serverHost: inputOptions.serverHost || 'localhost',
        fetchAttemptTimeout: inputOptions.fetchAttemptTimeout || 1000,
        fetchRepeatTimeout: inputOptions.fetchRepeatTimeout || 3000,
        consumerCallbacks: [],
        managedServerProcs: [],
        fullStop: false
    });

    const eventFunctionsMap = new Map();
    const localTrigger = (...args) => localTriggerImpl(
        eventFunctionsMap,
        options.channelName,
        ...args
    );

    let initialMessageQueue = [];
    let localPusher = message => initialMessageQueue.push(message);

    const messageBusInstance = Object.create(null, {
        onEvent: {
            value: (...args) => onEventImpl(eventFunctionsMap, ...args)
        },
        emitEvent: {
            value: (...args) => localPusher(...args)
        },
        dispose: {
            value: () => disposeImpl(options)
        }
    });

    Promise.all([consumerFactory(options, localTrigger), publisherFactory(options)])
        .then(([consumer, publisher]) => {
            localPusher = (...args) => emitEventImpl(
                publisher,
                options.channelName,
                ...args
            );

            initialMessageQueue.forEach(message => localPusher(message));
            initialMessageQueue = null;
        });

    return messageBusInstance;
};
