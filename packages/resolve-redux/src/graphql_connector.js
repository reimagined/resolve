import React from 'react';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider, graphql } from 'react-apollo';
import fetch from 'isomorphic-fetch';
import gql from 'graphql-tag';
import { getRootableUrl } from './util';

export default (gqlQuery, options = {}, endpoint) => {
    const client = new ApolloClient({
        link: new HttpLink({
            uri: endpoint || getRootableUrl('/api/query/graphql'),
            credentials: 'same-origin',
            fetch
        }),
        cache: new InMemoryCache()
    });

    return Component =>
        function ResolveGraphglConnector(props) {
            const GraphQLConnector = graphql(gql(gqlQuery), options)(Component);

            return (
                <ApolloProvider client={client}>
                    <GraphQLConnector {...props} />
                </ApolloProvider>
            );
        };
};
