import { init, attachConsumer, postMessage } from './connector';

function publisherFactory(options) {
    return init(options).then(() => (event) => {
        postMessage(event, options);
    });
};

function consumerFactory(options, trigger) {
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

function attachEvent(callbackMap, eventName, callback) {
    const callbackArray = callbackMap.get(eventName) || [];
    callbackArray.push(callback);
    callbackMap.set(eventName, callbackArray);
};

function onEventImpl(eventFunctionsMap, eventDescriptor, callback) {
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

function localTriggerImpl(eventFunctionsMap, eventSeparationField, message) {
    const callbacks = eventFunctionsMap.get(message[eventSeparationField]);
    if (callbacks) {
        callbacks.forEach(handler => handler(message));
    }
}

function disposeImpl(options) {
    const serverProcs = options.managedServerProcs;
    options.managedServerPid = null;
    options.fullStop = true;

    serverProcs.forEach(proc => proc.kill());
};

export default function expressBus(inputOptions) {
    const options = Object.assign({}, inputOptions, {
        exchangePort: inputOptions.exchangePort || 12999,
        eventSeparationField: inputOptions.eventSeparationField || '_type',
        messageTimeout: inputOptions.messageTimeout || 5000,
        serverHost: inputOptions.serverHost || 'localhost',
        fetchAttemptTimeout: inputOptions.fetchAttemptTimeout || 1000,
        fetchRepeatTimeout: inputOptions.fetchRepeatTimeout || 3000,
        disposePromise: inputOptions.disposePromise || null,
        consumerCallbacks: [],
        managedServerProcs: [],
        fullStop: false
    });

    const eventFunctionsMap = new Map();
    const localTrigger = (...args) => localTriggerImpl(
        eventFunctionsMap,
        options.eventSeparationField,
        ...args
    );

    let initialMessageQueue = [];
    let localPusher = message => initialMessageQueue.push(message);

    const messageBusInstance = {
        onEvent: (...args) => onEventImpl(eventFunctionsMap, ...args),
        emitEvent: (...args) => localPusher(...args)
    };

    if (options.disposePromise === Promise.resolve(options.disposePromise)) { // Check is promise
        options.disposePromise.then(() => disposeImpl(options));
    }

    Promise.all([consumerFactory(options, localTrigger), publisherFactory(options)])
        .then(([consumer, publisher]) => {
            localPusher = (...args) => publisher(...args);

            initialMessageQueue.forEach(message => localPusher(message));
            initialMessageQueue = null;
        });

    return messageBusInstance;
};
