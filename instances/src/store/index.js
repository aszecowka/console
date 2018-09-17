import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';
import builder from './../commons/builder';
import resolvers from './resolvers';
import defaults from './defaults';
import { getURL } from './../commons/api-url';
import { split, ApolloLink, concat } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

export function createApolloClient() {
  const cache = new InMemoryCache();
  const graphqlApiUrl = getURL(
    process.env.REACT_APP_LOCAL_API ? 'graphqlApiUrlLocal' : 'graphqlApiUrl',
  );

  const wsUrl = getURL('subscriptionsApiUrl');

  // Create an http link:
  const httpLink = new HttpLink({
    uri: graphqlApiUrl,
  });

  // Create a WebSocket link:
  const wsLink = new WebSocketLink({
    uri: wsUrl,
    options: {
      reconnect: true,
    },
  });

  const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    console.log('token', builder.getBearerToken());
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: builder.getBearerToken() || null,
      },
    }));
    return forward(operation);
  });

  const link = split(
    // split based on operation type
    ({ query }) => {
      console.log('Link', query);
      //const { kind, operation } = getMainDefinition(query);
      //return kind === 'OperationDefinition' && operation === 'subscription';
      return true;
    },
    httpLink,
    wsLink,
  );

  const client = new ApolloClient({
    link: concat(authMiddleware, link),
    // request: async operation => {
    //   operation.setContext(({ headers = {} }) => ({
    //     headers: {
    //       ...headers,
    //       authorization: builder.getBearerToken() || null,
    //     },
    //   }));
    // },
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
