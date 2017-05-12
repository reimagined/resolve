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

export default ({ pathToFile }) => ({
    saveEvent: event =>
        new Promise((resolve, reject) =>
            fs.appendFile(
                pathToFile,
                `${JSON.stringify(event, null, 2)},`,
                ENCODING,
                err => (err ? reject(err) : resolve())
            )
        ),

    loadEventsByTypes: (types, callback) =>
        loadEvents(pathToFile).then(events =>
            events.filter(event => types.includes(event.type)).sort(compareEvents).forEach(callback)
        ),

    loadEventsByAggregateId: (id, callback) =>
        loadEvents(pathToFile).then(events =>
            events.filter(event => event.aggregateId === id).sort(compareEvents).forEach(callback)
        )
});
