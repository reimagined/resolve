import childProcess from 'child_process';
import dns from 'dns';
import fetch from 'isomorphic-fetch';
import os from 'os';
import path from 'path';

const SELF_NETWORK_ADDRESSES = new Set();
Promise.resolve() // Guarantees a non-blocking call when loading the module
    .then(() => os.networkInterfaces())
    .then(networkInfo =>
        Object.keys(networkInfo).forEach(ifaceGroupName =>
            networkInfo[ifaceGroupName].forEach(iface => {
                SELF_NETWORK_ADDRESSES.add(iface.address)
            })
        )
    );

const serverPath = path.join(__dirname, './server');
const consumerCallbacks = [];

const post = (url, data) => {
    const options = { method: 'POST', credentials: 'same-origin' };
    if (data) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    return fetch(url, options);
}

const promiseRaceSafe = (promiseList) => {
    return new Promise((resolve, reject) =>
        promiseList.forEach(promise => promise.then(resolve, reject))
    );
}

const delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}

const roundFetch = (urlAddress, options, roundFetchOptions) => {
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

const checkIsOwnHost = (hostname) =>
    new Promise((resolve, reject) => dns.lookup(hostname, (err, result) => (
        (err || !SELF_NETWORK_ADDRESSES.has(result)) ? reject() : resolve()
    )));

const buildExchangeUrl = (options, isPost) => {
    const baseUrl = `http://${options.serverHost}:${options.exchangePort}/`;
    return isPost ? `${baseUrl}postMessage` : `${baseUrl}getMessages`;
};

const upstartServer = (options) => {
    // Spawn server only if it's network interface belongs to current host
    checkIsOwnHost(options.serverHost)
        .then(() => childProcess.fork(
            serverPath,
            [options.exchangePort, options.messageTimeout],
            { silent: false }
        ))
        .catch(() => null);

    return checkRunning(options).catch(
        () => upstartServer(options)
    );
}

const checkRunning = (options) => {
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

export const postMessage = (info, options) => {
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

const fetchMessages = (options) => {
    return promiseRaceSafe([
        fetch(buildExchangeUrl(options)).then(res => res.json()),
        delay(options.fetchRepeatTimeout).then(
            () => Promise.reject('Messagebus server not working')
        )
    ])
        .then(messagesList => consumerCallbacks.map(callback =>
            messagesList.forEach(message =>
                // Ensure that every consumer recieves own copy of bus message
                callback(JSON.parse(JSON.stringify(message)))
            )
        ))
        // Fetch loop ignores any failure, so continue anyway
        .then(() => delay(100), () => delay(100))
        .then(() => fetchMessages(options));
}

export const init = (options) => {
    return checkRunning(options).catch(
        () => upstartServer(options)
    );
}

export const attachConsumer = (func, options) => {
    if (consumerCallbacks.length === 0) {
        delay(100).then(() => fetchMessages(options));
    }

    consumerCallbacks.push(func);
}
