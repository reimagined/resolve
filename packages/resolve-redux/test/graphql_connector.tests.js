import { shallow } from 'enzyme';
import { expect } from 'chai';
import React from 'react';

import gqlConnector from '../src/graphql_connector';

describe('graphql connector', () => {
    let originalFetch = global.fetch;

    beforeAll(() => {
        global.fetch = (...args) => {};
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('should wrap component into graphql connector', () => {
        const WrappedComponent = gqlConnector('query { Test }')('div');
        const { props } = shallow(<WrappedComponent testProp="testValue" />).instance();
        expect(props).to.be.deep.equal({ testProp: 'testValue' });
    });
});
