import { expect } from 'chai';

import createMemoryAdapter from '../src/index';

describe('Read model memory adapter', function () {
    it('should be created from factory function with apropriate API', () => {
        const adapter = createMemoryAdapter();
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');
    });

    it('', () => {});
});
