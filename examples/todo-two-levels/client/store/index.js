import { createStore, applyMiddleware, compose } from 'redux';
import { createResolveMiddleware } from 'resolve-redux';
import reducer from '../reducers';
import viewModels from '../../common/view-models';

const isClient = typeof window === 'object';

const composeEnhancers =
    isClient && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
        : compose;

const middleware = [createResolveMiddleware(viewModels)];

const enhancer = composeEnhancers(applyMiddleware(...middleware));

export default initialState => createStore(reducer, initialState, enhancer);
