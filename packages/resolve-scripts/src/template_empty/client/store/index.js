import { createStore, applyMiddleware } from 'redux';
import { sendCommandMiddleware, setSubscriptionMiddleware } from 'resolve-redux';
import reducer from '../reducers';

const middleware = [
    sendCommandMiddleware(),
    setSubscriptionMiddleware({
        rootDirPath: process.env.ROOT_DIR
    })
];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
