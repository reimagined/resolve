import clone from 'clone';

export default function buildRead(repository, read) {
    const collections = repository.collections;
    async function customRead(...args) {
        if (Array.isArray(args[0])) {
            return customRead('default', args[0]);
        }

        if (args[0] && args[0].hasOwnProperty('aggregateIds')) {
            return customRead('default', args[0].aggregateIds);
        }

        const result = await read({ aggregateIds: args[1] });
        const collectionName = args[0] || 'default';

        let state = result.get(collectionName);
        if (state === undefined) {
            state = (collections.find(coll => coll.name === collectionName) || {}).initialState;
        }
        return clone(state);
    }

    return customRead;
}
