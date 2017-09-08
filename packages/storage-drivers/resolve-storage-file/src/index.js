import fs from 'fs';

const ENCODING = 'utf8';

const loadEvents = path =>
    new Promise((resolve, reject) =>
        fs.readFile(path, ENCODING, (err, content) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
                return;
            }
            resolve(content ? JSON.parse(`[${content.replace(/,$/, '')}]`) : []);
        })
    );

const compareEvents = (a, b) => a.timestamp - b.timestamp;

function createDriver({ pathToFile }) {
    function saveEvent(event) {
        return new Promise((resolve, reject) =>
            fs.appendFile(
                pathToFile,
                `${JSON.stringify(event, null, 2)},`,
                ENCODING,
                err => (err ? reject(err) : resolve())
            )
        );
    }

    function loadEventsByTypes(types, callback) {
        return loadEvents(pathToFile).then(events =>
            events.filter(event => types.includes(event.type)).sort(compareEvents).forEach(callback)
        );
    }

    function loadEventsByAggregateIds(ids, callback) {
        return loadEvents(pathToFile).then(events =>
            events
                .filter(event => ids.includes(event.aggregateId))
                .sort(compareEvents)
                .forEach(callback)
        );
    }

    return {
        saveEvent,
        loadEventsByTypes,
        loadEventsByAggregateIds
    };
}

export default createDriver;
