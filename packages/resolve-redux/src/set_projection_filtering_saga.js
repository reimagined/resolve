import { put } from 'redux-saga/effects';
import actions from './actions';

const projectionFilters = {};

export default function* setProjectionFilteringSaga(projectionName, filter) {
    const originalFilter = projectionFilters[projectionName];
    projectionFilters[projectionName] = filter;

    if(originalFilter !== filter) {
        yield put(actions.requestInitialState(projectionName, filter));
    }
}
