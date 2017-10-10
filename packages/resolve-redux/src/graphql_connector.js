import ApolloClient, { createNetworkInterface } from 'apollo-client';
import React from 'react';
import { ApolloProvider, graphql, gql } from 'react-apollo';

const networkInterface = createNetworkInterface({ uri: '/api/graphql' });
const client = new ApolloClient({ networkInterface });

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
