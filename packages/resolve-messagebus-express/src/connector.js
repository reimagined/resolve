import childProcess from 'child_process';
import fetch from 'isomorphic-fetch';
import path from 'path';

const serverPath = path.join(__dirname, './server');

function post(url, data) {
    const options = { method: 'POST', credentials: 'same-origin' };
    if (data) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    return fetch(url, options);
}

function promiseRaceSafe(promiseList) {
    return new Promise((resolve, reject) =>
        promiseList.forEach(promise => promise.then(resolve, reject))
    );
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function roundFetch(urlAddress, options, roundFetchOptions) {
    return promiseRaceSafe([
        fetch(urlAddress, options).then(response =>
            (response.ok ? response : Promise.reject(new Error(response.statusText)))
        ),
        delay(roundFetchOptions.timeout).then(() =>
            Promise.reject('Fetch timeout')
        )
    ])
        .then(response => response.text())
        .then((text) => {
            if (!roundFetchOptions.validateFunction(text)) {
                throw new Error(roundFetchOptions.invalidateMessage);
            }

            roundFetchOptions.repeat = false;
            return text;
        })
        .catch(() =>
            delay(roundFetchOptions.timeout).then(() => (
                roundFetchOptions.repeat ?
                    roundFetch(urlAddress, options, roundFetchOptions) :
                    Promise.reject('Round-fetch cancelled')
            ))
        );
}

function buildExchangeUrl(options, isPost) {
    const baseUrl = `http://${options.serverHost}:${options.exchangePort}/`;
    return isPost ? `${baseUrl}postMessage` : `${baseUrl}getMessages`;
};

function upstartServer(options) {
    // Spawn server only if it's network interface belongs to current host
    if ((options.managedServerProcs !== null) && (options.serverHost === 'localhost')) {
        options.managedServerProcs.push(childProcess.fork(
            serverPath,
            [options.exchangePort, options.messageTimeout],
            { silent: true }
        ));
    }

    if (options.fullStop) return Promise.reject();

    return checkRunning(options).catch(
        () => upstartServer(options)
    );
}

function checkRunning(options) {
    if (options.fullStop) return Promise.reject();

    return promiseRaceSafe([
        roundFetch(buildExchangeUrl(options), {}, {
            validateFunction: text => (text !== ''),
            invalidateMessage: 'Local bus not available',
            repeat: true,
            timeout: options.fetchAttemptTimeout
        }),
        delay(options.fetchRepeatTimeout).then(() =>
            Promise.reject('Messagebus server not working')
        )
    ]);
}

export function postMessage(info, options) {
    if (options.fullStop) return Promise.reject();

    return promiseRaceSafe([
        post(buildExchangeUrl(options, true), info).then(res => res.json()),
        delay(options.fetchAttemptTimeout).then(
            () => Promise.reject('Messagebus server not working')
        )
    ]).catch(() =>
        // Automatical messagebus server restart on failure
        upstartServer(options).then(
            () => postMessage(info, options)
        )
    );
}

function fetchMessages(options) {
    if (options.fullStop) return Promise.reject();

    return promiseRaceSafe([
        fetch(buildExchangeUrl(options)).then(res => res.json()),
        delay(options.fetchRepeatTimeout).then(
            () => Promise.reject('Messagebus server not working')
        )
    ])
        .then(messagesList => options.consumerCallbacks.map(callback =>
            messagesList.forEach(message =>
                // Ensure that every consumer recieves own copy of bus message
                callback(JSON.parse(JSON.stringify(message)))
            )
        ))
        // Fetch loop ignores any failure, so continue anyway
        .then(() => delay(100), () => delay(100))
        .then(() => fetchMessages(options));
}

export function init(options) {
    return checkRunning(options).catch(
        () => upstartServer(options)
    );
}

export function attachConsumer(func, options) {
    if (options.consumerCallbacks.length === 0) {
        delay(100).then(() => fetchMessages(options));
    }

    options.consumerCallbacks.push(func);
}
