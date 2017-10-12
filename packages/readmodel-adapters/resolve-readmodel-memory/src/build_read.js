import clone from 'clone';

export default function buildRead(repository, read) {
    return async (collectionName = 'default', aggregateIds) => {
        const result = await read({ aggregateIds });
        return clone(result.get(collectionName));
    }
}