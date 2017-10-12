import sinon from 'sinon';
import { expect } from 'chai';

import createMemoryAdapter from '../src/index';

describe('createMemoryAdapter', function () {
    it('should return memory adapter', function () {
        const adapter = createMemoryAdapter();

        expect(adapter.buildRead).to.be.a('function')
        expect(adapter.buildProjection).to.be.a('function')
        expect(adapter.init).to.be.a('function')
        expect(adapter.get).to.be.a('function')
        expect(adapter.reset).to.be.a('function')
    })
})