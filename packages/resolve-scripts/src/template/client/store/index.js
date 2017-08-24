import axios from 'axios';
import { createStore, applyMiddleware } from 'redux';
import { sendCommandMiddleware } from 'resolve-redux';
import reducer from '../reducers';

const middleware = [
    sendCommandMiddleware({
        sendCommand: async command =>
            axios.post(`${window.__PROCESS_ENV__.ROOT_DIR}/api/commands`, command)
    })
];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
