import {gql, useMutation, useQuery} from '@apollo/client';
import {useCallback} from 'react';

import {
  GetAutoMaterializePausedQuery,
  GetAutoMaterializePausedQueryVariables,
  SetAutoMaterializePausedMutation,
  SetAutoMaterializePausedMutationVariables,
} from './types/useAutomaterializeDaemonStatus.types';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';

export function useAutomaterializeDaemonStatus() {
  const queryResult = useQuery<
    GetAutoMaterializePausedQuery,
    GetAutoMaterializePausedQueryVariables
  >(AUTOMATERIALIZE_PAUSED_QUERY);
  useBlockTraceOnQueryResult(queryResult, 'GetAutoMaterializePausedQuery');
  const {data, loading, refetch} = queryResult;

  const [setAutoMaterializePaused] = useMutation<
    SetAutoMaterializePausedMutation,
    SetAutoMaterializePausedMutationVariables
  >(SET_AUTOMATERIALIZE_PAUSED_MUTATION, {
    onCompleted: () => {
      refetch();
    },
  });

  const setPaused = useCallback(
    (paused: boolean) => {
      setAutoMaterializePaused({variables: {paused}});
    },
    [setAutoMaterializePaused],
  );

  return {
    loading: !data && loading,
    setPaused,
    paused: data?.instance?.autoMaterializePaused,
    refetch,
  };
}

export const AUTOMATERIALIZE_PAUSED_QUERY = gql`
  query GetAutoMaterializePausedQuery {
    instance {
      id
      autoMaterializePaused
    }
  }
`;

export const SET_AUTOMATERIALIZE_PAUSED_MUTATION = gql`
  mutation SetAutoMaterializePausedMutation($paused: Boolean!) {
    setAutoMaterializePaused(paused: $paused)
  }
`;
