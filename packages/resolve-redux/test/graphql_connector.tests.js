import React from 'react';
import { expect } from 'chai';
import gqlConnector from '../src/graphql_connector';

describe('graphql connector', () => {
    it('should wrap component into graphql connector', () => {
        const TestComponent = <div>Test component</div>;
        const ConnectedTestComponent = gqlConnector('query');
    });
});
