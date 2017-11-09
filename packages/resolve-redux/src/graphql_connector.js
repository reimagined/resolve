import React from 'react';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider, graphql } from 'react-apollo';
import gql from 'graphql-tag';

export default (gqlQuery, matchVariables = () => ({}), endpoint) => {
    const client = new ApolloClient({
        link: new HttpLink({ uri: endpoint || '/api/query/graphql' }),
        cache: new InMemoryCache()
    });

    return Component =>
        function ResolveGraphglConnector(props) {
            const GraphQLConnector = graphql(gql(gqlQuery), {
                options: ownProps => ({ variables: matchVariables(ownProps) })
            })(Component);

            return (
                <ApolloProvider client={client}>
                    <GraphQLConnector {...props} />
                </ApolloProvider>
            );
        };
};
