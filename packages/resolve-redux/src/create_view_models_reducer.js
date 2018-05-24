import {
  SUBSCRIBE_VIEWMODEL,
  UNSUBSCRIBE_VIEWMODEL,
  PROVIDE_VIEW_MODELS,
  MERGE
} from './action_types';
import { getKey } from './utils';

export function subscribeHandler(
  { subscribers, viewModels },
  state,
  { viewModelName, aggregateId }
) {
  const key = getKey(viewModelName, aggregateId);

  if (subscribers[key]) {
    subscribers[key]++;
    return state;
  }

  subscribers[key] = 1;

  return {
    ...state,
    [viewModelName]: {
      ...state[viewModelName],
      [aggregateId]: (viewModels.find(({ name }) => viewModelName === name)
        .projection.Init || (() => {}))()
    }
  };
}

export function unsubscribeHandler(
  { subscribers },
  state,
  { viewModelName, aggregateId }
) {
  const key = getKey(viewModelName, aggregateId);

  if (subscribers[key] > 1) {
    subscribers[key]--;
    return state;
  }

  subscribers[key] = 0;

  const nextViewModel = { ...state[viewModelName] };
  delete nextViewModel[aggregateId];

  return {
    ...state,
    [viewModelName]: nextViewModel
  };
}

export function mergeHandler(
  _,
  state,
  { viewModelName, aggregateId, state: actionState }
) {
  return {
    ...state,
    [viewModelName]: {
      ...state[viewModelName],
      [aggregateId]: actionState
    }
  };
}

export function provideViewModelsHandler(context, state, { viewModels }) {
  const { handlers, initialState } = context;
  context.viewModels = viewModels;

  delete handlers[PROVIDE_VIEW_MODELS];

  handlers[SUBSCRIBE_VIEWMODEL] = subscribeHandler.bind(null, context);

  handlers[UNSUBSCRIBE_VIEWMODEL] = unsubscribeHandler.bind(null, context);

  handlers[MERGE] = mergeHandler.bind(null, context);

  viewModels.forEach(({ name: viewModelName }) => {
    initialState[viewModelName] = {
      ...initialState[viewModelName]
    };
  });

  const map = createMap(viewModels);

  Object.keys(map).forEach(eventType => {
    handlers[eventType] = viewModelEventHandler.bind(null, map[eventType]);
  });

  return initialState;
}

export function createMap(viewModels) {
  return viewModels.reduce((acc, { name: viewModelName, projection }) => {
    const handlers = { ...projection };
    delete handlers.Init;
    Object.keys(handlers).forEach(eventType => {
      if (!acc[eventType]) {
        acc[eventType] = {};
      }

      acc[eventType][viewModelName] = projection[eventType];
    });
    return acc;
  }, {});
}

export function viewModelEventHandler(viewModels, state, action) {
  const nextState = { ...state };

  Object.keys(viewModels).forEach(viewModelName => {
    if (!state[viewModelName]) return;

    if (state[viewModelName].hasOwnProperty('*')) {
      const viewModelState = state[viewModelName]['*'];

      const result = viewModels[viewModelName](viewModelState, action);

      nextState[viewModelName] = {
        ...nextState[viewModelName],
        '*': result
      };
    }

    if (!state[viewModelName].hasOwnProperty(action.aggregateId)) return;

    const viewModelState = state[viewModelName][action.aggregateId];

    const result = viewModels[viewModelName](viewModelState, action);

    nextState[viewModelName] = {
      ...nextState[viewModelName],
      [action.aggregateId]: result
    };
  });

  return nextState;
}

export default function createViewModelsReducer() {
  const context = {
    initialState: {},
    handlers: {},
    subscribers: {}
  };

  context.handlers[PROVIDE_VIEW_MODELS] = provideViewModelsHandler.bind(
    null,
    context
  );

  return (state = {}, action) => {
    const eventHandler = context.handlers[action.type];

    if (eventHandler) {
      return eventHandler(state, action);
    }

    return state;
  };
}
