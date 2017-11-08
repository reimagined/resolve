import objectHash from 'object-hash';

export const INIT_EVENT = Symbol.for('INIT_EVENT');

export function hash(onDemandOptions = null) {
    return objectHash(onDemandOptions, {
        unorderedArrays: true,
        unorderedSets: true
    });
}
