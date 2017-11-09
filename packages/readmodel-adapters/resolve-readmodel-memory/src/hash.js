import objectHash from 'object-hash';

export default function hash(onDemandOptions = null) {
    return objectHash(onDemandOptions, {
        unorderedArrays: true,
        unorderedSets: true
    });
}
