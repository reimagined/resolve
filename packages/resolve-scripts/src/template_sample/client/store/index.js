import { createStore, applyMiddleware } from 'redux';
import { sendCommandMiddleware, setSubscriptionMiddleware } from 'resolve-redux';
import reducer from '../reducers';
import viewModel from '../../common/view-models/default';

const middleware = [sendCommandMiddleware(), setSubscriptionMiddleware()];

export default (initialState) => {
    return createStore(
        reducer,
        viewModel.deserializeState(initialState),
        applyMiddleware(...middleware)
    );
};
