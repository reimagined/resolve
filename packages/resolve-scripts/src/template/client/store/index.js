import axios from 'axios';
import { createStore, applyMiddleware } from 'redux';
import {
  sendCommandMiddleware,
  setSubscriptionMiddleware
} from 'resolve-redux';
import reducer from '../reducers';

const middleware = [
    sendCommandMiddleware({
        sendCommand: async command => axios.post(`${process.env.ROOT_DIR}/api/commands`, command)
    }),
    setSubscriptionMiddleware({
        rootDirPath: process.env.ROOT_DIR
    })
];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
