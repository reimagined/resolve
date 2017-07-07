import { expect } from 'chai';
import {
    actions,
    createReducer,
    createActions,
    sendCommandMiddleware,
    fetchMoreMiddleware
} from '../src';

describe('resolve-redux', () => {
    it('works the same way for different import types', () => {
        const importedModule = require('../src');
        expect(actions).to.be.equal(importedModule.actions);
        expect(createReducer).to.be.equal(importedModule.createReducer);
        expect(createActions).to.be.equal(importedModule.createActions);
        expect(sendCommandMiddleware).to.be.equal(importedModule.sendCommandMiddleware);
        expect(fetchMoreMiddleware).to.be.equal(importedModule.fetchMoreMiddleware);
    });
});
