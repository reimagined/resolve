import clone from 'clone';

export default function buildRead(repository, read) {
    async function customRead(...args) {
        if (Array.isArray(args[0])) {
            return customRead('default', args[0]);
        }

        if (args[0] && args[0].hasOwnProperty('aggregateIds')) {
            return customRead('default', args[0].aggregateIds);
        }

        const loadCollection = await read({ aggregateIds: args[1] });
        const collectionName = args[0] || 'default';

        return loadCollection(collectionName);
    }

    return customRead;
}
