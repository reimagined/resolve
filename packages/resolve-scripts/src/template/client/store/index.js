import { createStore, applyMiddleware } from 'redux';
import { sendCommandMiddleware, setSubscriptionMiddleware } from 'resolve-redux';
import reducer from '../reducers';

export default initialState =>
    createStore(
        reducer,
        initialState,
        applyMiddleware(sendCommandMiddleware(), setSubscriptionMiddleware())
    );
