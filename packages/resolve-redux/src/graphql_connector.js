import React from 'react';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { ApolloProvider, graphql, gql } from 'react-apollo';

export default (gqlQuery, matchVariables = () => ({}), endpoint) => {
    const client = new ApolloClient({
        networkInterface: createNetworkInterface({ uri: endpoint || '/api/query/graphql' })
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
