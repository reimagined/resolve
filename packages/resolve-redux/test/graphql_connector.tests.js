import { HTTPFetchNetworkInterface } from 'apollo-client';
import { configure as enzymeConfigure, shallow } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-15';
import { expect } from 'chai';
import React from 'react';

import gqlConnector from '../src/graphql_connector';

describe('graphql connector', () => {
    before(() => {
        enzymeConfigure({ adapter: new EnzymeAdapter() });
    });

    let testNetworkInterface = null;

    beforeEach(() => {
        testNetworkInterface = Object.create(HTTPFetchNetworkInterface.prototype.__proto__, {
            query: {
                value: request => Promise.resolve({ testVar: 'testVarContent', request })
            }
        });
    });

    afterEach(() => {
        testNetworkInterface = null;
    });

    it.only('should wrap component into graphql connector', () => {
        const TestComponent = ({ text }) => <div>Test: ${text}</div>;
        const ConnectedTestComponent = gqlConnector(
            'query { Test }',
            vars => vars,
            testNetworkInterface
        )(TestComponent);
        const wrapper = shallow(<ConnectedTestComponent />);

        console.log(wrapper);
    });
});
