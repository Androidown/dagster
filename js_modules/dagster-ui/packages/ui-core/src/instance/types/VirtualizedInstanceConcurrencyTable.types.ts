// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type SingleConcurrencyKeyQueryVariables = Types.Exact<{
  concurrencyKey: Types.Scalars['String']['input'];
}>;

export type SingleConcurrencyKeyQuery = {
  __typename: 'Query';
  instance: {
    __typename: 'Instance';
    id: string;
    concurrencyLimit: {
      __typename: 'ConcurrencyKeyInfo';
      concurrencyKey: string;
      slotCount: number;
      claimedSlots: Array<{__typename: 'ClaimedConcurrencySlot'; runId: string; stepKey: string}>;
      pendingSteps: Array<{
        __typename: 'PendingConcurrencyStep';
        runId: string;
        stepKey: string;
        enqueuedTimestamp: number;
        assignedTimestamp: number | null;
        priority: number | null;
      }>;
    };
  };
};
