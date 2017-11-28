import { combineReducers } from 'redux';
import { createViewModelsReducer } from 'resolve-redux';

const visibilityFilter = (state = 'SHOW_ALL', action) => {
    switch (action.type) {
        case 'SET_VISIBILITY_FILTER':
            return action.filter;
        default:
            return state;
    }
};

const todoApp = combineReducers({
    viewModels: createViewModelsReducer(),
    visibilityFilter
});

export default todoApp;
