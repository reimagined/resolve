import { createStore, applyMiddleware, combineReducers } from 'redux';
import {
  createViewModelsReducer,
  createReadModelsReducer,
  createJwtReducer,
  createResolveMiddleware
} from 'resolve-redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import { composeWithDevTools } from 'redux-devtools-extension';

const reducers = require($resolve.redux.reducers);
const middlewares = require($resolve.redux.middlewares);
const setupStore = require($resolve.redux.store);
const viewModels = require($resolve.viewModels);
const readModels = require($resolve.readModels);
const aggregates = require($resolve.aggregates);
const subscribeAdapter = require($resolve.subscribe.adapter);

export default ({ initialState, history, origin, rootPath }) => {
  const store = createStore(
    combineReducers({
      ...reducers,
      router: routerReducer,
      viewModels: createViewModelsReducer(),
      readModels: createReadModelsReducer(),
      jwt: createJwtReducer()
    }),
    initialState,
    composeWithDevTools(
      applyMiddleware(
        routerMiddleware(history),
        createResolveMiddleware({
          viewModels,
          readModels,
          aggregates,
          subscribeAdapter,
          origin,
          rootPath
        }),
        ...middlewares
      )
    )
  );

  setupStore(store, middlewares);

  return store;
};
