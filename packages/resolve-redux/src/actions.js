export const MERGE = '@@resolve/PROJECTION_STATE_MERGE';
export const FETCH_MORE = '@@resolve/PROJECTION_FETCH_MORE';
export const SEND_COMMAND = '@@resolve/SEND_COMMAND';

function merge(projectionName, state) {
    return {
        type: MERGE,
        projectionName,
        state
    };
}

// TODO
function sendCommand(/* { aggregateId, aggregateType, ...args } */) {
    // return {
    //     type: SEND_COMMAND,
    //     aggregateId,
    //     aggregateType,
    //     ...args
    // };
}

function fetchMore(projectionName, query) {
    return {
        type: FETCH_MORE,
        projectionName,
        query
    };
}

export default {
    merge,
    sendCommand,
    fetchMore
};
