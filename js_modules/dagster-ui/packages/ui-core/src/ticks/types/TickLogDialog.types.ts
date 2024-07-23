// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type TickLogEventsQueryVariables = Types.Exact<{
  instigationSelector: Types.InstigationSelector;
  tickId: Types.Scalars['BigInt']['input'];
}>;

export type TickLogEventsQuery = {
  __typename: 'Query';
  instigationStateOrError:
    | {
        __typename: 'InstigationState';
        id: string;
        instigationType: Types.InstigationType;
        tick: {
          __typename: 'InstigationTick';
          id: string;
          status: Types.InstigationTickStatus;
          timestamp: number;
          logEvents: {
            __typename: 'InstigationEventConnection';
            events: Array<{
              __typename: 'InstigationEvent';
              message: string;
              timestamp: string;
              level: Types.LogLevel;
            }>;
          };
        };
      }
    | {__typename: 'InstigationStateNotFoundError'}
    | {__typename: 'PythonError'};
};
