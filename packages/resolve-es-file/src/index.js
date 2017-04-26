import fs from 'fs';

const loadEvents = path => new Promise((resolve, reject) =>
    fs.readFile(path, 'utf8', (err, content) =>
        (err ? reject(err) : resolve(content ? JSON.parse(content) : []))
    )
);

export default ({ pathToFile }) => ({
    saveEvent: event =>
        loadEvents(pathToFile)
        .then(events => new Promise((resolve, reject) => {
            events.push(event);
            fs.writeFile(pathToFile, JSON.stringify(events, null, 2), 'utf8', err =>
                (err ? reject(err) : resolve())
            );
        })),

    loadEventsByTypes: (types, callback) =>
        loadEvents(pathToFile)
        .then(events => events.filter(event => types.includes(event.__type)).forEach(callback)),

    loadEventsByAggregateId: (id, callback) =>
        loadEvents(pathToFile)
        .then(events => events.filter(event => event.__aggregateId === id).forEach(callback))
});
