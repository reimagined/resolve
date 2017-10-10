import React from 'react';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { ApolloProvider, graphql, gql } from 'react-apollo';

export const networkInterface = createNetworkInterface({ uri: '/api/graphql' });
export const client = new ApolloClient({ networkInterface });

export default (gqlQuery, matchVariables = () => {}) => Component =>
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
