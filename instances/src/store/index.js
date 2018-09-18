import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import builder from './../commons/builder';
import resolvers from './resolvers';
import defaults from './defaults';
import { getURL } from './../commons/api-url';
import { split, ApolloLink, concat } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';

export function createApolloClient() {
  const cache = new InMemoryCache();
  const graphqlApiUrl = getURL(
    process.env.REACT_APP_LOCAL_API ? 'graphqlApiUrlLocal' : 'graphqlApiUrl',
  );

  //  const wsUrl = getURL('subscriptionsApiUrl');
  const wsUrl = 'wss://ui-api.kyma.local/graphql/subscriptions';

  // Create an http link:
  const httpLink = new HttpLink({
    uri: graphqlApiUrl,
  });

  // Create a WebSocket link:
  const wsLink = new WebSocketLink({
    uri: wsUrl,
    options: {
      reconnect: true,
      connectionParams: () => {
        console.log('connection params ', builder.getBearerToken());
        return {
          authToken: builder.getBearerToken() || null,
        };
      },
    },
  });

  // const authMiddleware = new ApolloLink((operation, forward) => {
  //     // add the authorization to the headers
  //     console.log('token', builder.getBearerToken());
  //     operation.setContext(({headers = {}}) => ({
  //         headers: {
  //             ...headers,
  //             authorization: builder.getBearerToken() || null,
  //         },
  //     }));
  //     return forward(operation);
  // });

  const link2 = split(
    // split based on operation type
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      let v = kind === 'OperationDefinition' && operation === 'subscription';
      console.log('Link splitting', v, query);
    },
    wsLink,
    httpLink,
  );

  const client = new ApolloClient({
    link: link2,

    request: async operation => {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          authorization: builder.getBearerToken() || null,
        },
      }));
    },
    cache: cache,
    onError: ({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        console.error('Apollo GraphQLError:', graphQLErrors);
      }
      if (networkError) {
        console.error('Apollo NetworkError:', networkError);
      }
    },
    clientState: {
      defaults,
      resolvers,
    },
  });

  console.log('client XXX', client);

  return client;
}
