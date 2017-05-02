import fs from 'fs';

const ENCODING = 'utf8';

const loadEvents = path =>
    new Promise((resolve, reject) =>
        fs.readFile(
            path,
            ENCODING,
            (err, content) =>
                (err
                    ? reject(err)
                    : resolve(content ? JSON.parse(`[${content.replace(/,$/, '')}]`) : []))
        )
    );

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
            events.filter(event => types.includes(event.__type)).forEach(callback)
        ),

    loadEventsByAggregateId: (id, callback) =>
        loadEvents(pathToFile).then(events =>
            events.filter(event => event.__aggregateId === id).forEach(callback)
        )
});
