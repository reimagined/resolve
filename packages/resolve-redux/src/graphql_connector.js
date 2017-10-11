import React from 'react';
import ApolloClient, { createNetworkInterface, HTTPFetchNetworkInterface } from 'apollo-client';
import { ApolloProvider, graphql, gql } from 'react-apollo';

const cache = new Map();

function getAppoloClientForEndpoint(endpoint = null) {
    if (cache.has(endpoint)) {
        return cache.get(endpoint);
    }

    const networkInterface = endpoint === null || endpoint instanceof String
        ? createNetworkInterface({ uri: !endpoint ? '/api/graphql' : endpoint })
        : endpoint instanceof QQQ ? endpoint : null;

    if (!networkInterface) {
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    const client = new ApolloClient({ networkInterface });
    cache.set(endpoint, client);
    return client;
}

export default (gqlQuery, matchVariables = () => {}, endpoint) => {
    const client = getAppoloClientForEndpoint(endpoint);

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
