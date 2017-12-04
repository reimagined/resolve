import { expect } from 'chai';

import createMongoAdapter from '../src/index';

describe('Read model MongoDB adapter', () => {
    let adapter;

    beforeEach(async () => {
        adapter = createMongoAdapter();
    });

    afterEach(() => {
        adapter = null;
    });

    it('should have apropriate API', () => {
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');
    });
});
