import { expect } from 'chai';
import { actions, createReducer, saga } from '../src';

describe('resolve-redux', () => {
    it('works the same way for different import types', () => {
        const importedModule = require('../src');
        expect(actions).to.be.equal(importedModule.actions);
        expect(createReducer).to.be.equal(importedModule.createReducer);
        expect(saga).to.be.equal(importedModule.saga);
    });
});
