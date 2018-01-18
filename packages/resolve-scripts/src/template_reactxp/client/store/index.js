import { createStore, applyMiddleware } from 'redux';
import { resolveMiddleware } from 'resolve-redux';
import reducer from '../reducers';
import viewModels from '../../common/view-models';

const middleware = [resolveMiddleware(viewModels)];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
