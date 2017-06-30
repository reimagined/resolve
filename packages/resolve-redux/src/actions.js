export const MERGE = '@@resolve/PROJECTION_STATE_MERGE';
export const SET_PROJECTION_FILTERING = '@@resolve/SET_PROJECTION_FILTERING';
export const REQUEST_INITIAL_STATE = '@@resolve/REQUEST_INITIAL_STATE';
export const FETCH_MORE = '@@resolve/PROJECTION_FETCH_MORE';
export const SEND_COMMAND = '@@resolve/SEND_COMMAND';
export const SET_STATE = '@@resolve/SET_STATE';

function merge(projectionName, state) {
    return {
        type: MERGE,
        projectionName,
        state
    };
}

function sendCommand({ command, aggregateId, aggregateName, payload }) {
    return {
        type: SEND_COMMAND,
        command,
        aggregateId,
        aggregateName,
        payload
    };
}

function fetchMore(projectionName, query) {
    return {
        type: FETCH_MORE,
        projectionName,
        query
    };
}

function requestInitialState(projectionName, filter) {
    return {
        type: REQUEST_INITIAL_STATE,
        projectionName,
        filter
    };
}

function setProjectionFiltering(projectionName, filter) {
    return {
        type: SET_PROJECTION_FILTERING,
        projectionName,
        filter
    };
}

function setState(projectionName, state) {
    return {
        type: SET_STATE,
        projectionName,
        state
    };
}

export default {
    merge,
    requestInitialState,
    setProjectionFiltering,
    sendCommand,
    fetchMore,
    setState
};
