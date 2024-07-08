import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { InMemoryCache, split } from '@apollo/client/core';
import { createHttpLink } from '@apollo/client/link/http';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { AppComponent } from './app/app.component';
import { environment } from '../environments/environment';

const httpLink = createHttpLink({
  uri: environment.APPSYNC_GRAPHQL_ENDPOINT,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-api-key': environment.APPSYNC_API_KEY,
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: environment.APPSYNC_REALTIME_HOST,
    connectionParams: {
      headers: {
        'x-api-key': environment.APPSYNC_API_KEY,
        'Sec-WebSocket-Protocol': 'graphql-ws',
        host: environment.APPSYNC_HOST,
      },
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    ApolloModule,
    {
      provide: APOLLO_OPTIONS,
      useFactory: () => {
        return {
          cache: new InMemoryCache(),
          link: splitLink,
        };
      },
    },
  ],
});
