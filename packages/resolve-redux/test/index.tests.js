import { expect } from 'chai';
import {
    actions,
    createReducer,
    createActions,
    gqlConnector,
    sendCommandMiddleware,
    setSubscriptionMiddleware
} from '../src';

describe('resolve-redux', () => {
    it('works the same way for different import types', () => {
        const importedModule = require('../src');
        expect(actions).to.be.equal(importedModule.actions);
        expect(createReducer).to.be.equal(importedModule.createReducer);
        expect(createActions).to.be.equal(importedModule.createActions);
        expect(gqlConnector).to.be.equal(importedModule.gqlConnector);
        expect(sendCommandMiddleware).to.be.equal(importedModule.sendCommandMiddleware);
        expect(setSubscriptionMiddleware).to.be.equal(importedModule.setSubscriptionMiddleware);
    });
});
