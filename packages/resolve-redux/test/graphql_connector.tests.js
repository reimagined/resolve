import React from 'react';
import { expect } from 'chai';
import gqlConnector from '../src/graphql_connector';

describe('graphql connector', () => {
    it('should wrap component into graphql connector', () => {
        const TestComponent = ({ textl }) => <div>Test: ${text}</div>;
        const ConnectedTestComponent = gqlConnector('query')(TestComponent);
        const jsx = <ConnectedTestComponent />;

        console.log(jsx);
    });
});
