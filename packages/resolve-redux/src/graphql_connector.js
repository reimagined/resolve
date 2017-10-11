import React from 'react';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { BaseNetworkInterface } from 'apollo-client/transport/networkInterface';
import { ApolloProvider, graphql, gql } from 'react-apollo';

const cache = new Map();

function getAppoloClientForEndpoint(endpoint = null) {
    if (cache.has(endpoint)) {
        return cache.get(endpoint);
    }

    let client;
    if (endpoint === null) {
        client = new ApolloClient({
            networkInterface: createNetworkInterface({ uri: '/api/graphql' })
        });
    } else if (endpoint instanceof String) {
        client = new ApolloClient({ networkInterface: createNetworkInterface({ uri: endpoint }) });
    } else if (endpoint instanceof BaseNetworkInterface) {
        client = new ApolloClient({ networkInterface: endpoint });
    } else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

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
