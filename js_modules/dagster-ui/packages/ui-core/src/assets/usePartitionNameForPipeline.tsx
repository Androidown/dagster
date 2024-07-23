import {gql, useQuery} from '@apollo/client';
import {useMemo} from 'react';

import {
  AssetJobPartitionSetsQuery,
  AssetJobPartitionSetsQueryVariables,
} from './types/usePartitionNameForPipeline.types';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {RepoAddress} from '../workspace/types';

export function usePartitionNameForPipeline(repoAddress: RepoAddress, pipelineName: string) {
  const queryResult = useQuery<AssetJobPartitionSetsQuery, AssetJobPartitionSetsQueryVariables>(
    ASSET_JOB_PARTITION_SETS_QUERY,
    {
      skip: !pipelineName,
      variables: {
        repositoryLocationName: repoAddress.location,
        repositoryName: repoAddress.name,
        pipelineName,
      },
    },
  );

  useBlockTraceOnQueryResult(queryResult, 'AssetJobPartitionSetsQuery', {skip: !pipelineName});
  const {data: partitionSetsData} = queryResult;

  return useMemo(
    () => ({
      partitionSet:
        partitionSetsData?.partitionSetsOrError.__typename === 'PartitionSets'
          ? partitionSetsData.partitionSetsOrError.results[0]
          : undefined,
      partitionSetError:
        partitionSetsData?.partitionSetsOrError.__typename === 'PipelineNotFoundError' ||
        partitionSetsData?.partitionSetsOrError.__typename === 'PythonError'
          ? partitionSetsData.partitionSetsOrError
          : undefined,
    }),
    [partitionSetsData],
  );
}

export const ASSET_JOB_PARTITION_SETS_QUERY = gql`
  query AssetJobPartitionSetsQuery(
    $pipelineName: String!
    $repositoryName: String!
    $repositoryLocationName: String!
  ) {
    partitionSetsOrError(
      pipelineName: $pipelineName
      repositorySelector: {
        repositoryName: $repositoryName
        repositoryLocationName: $repositoryLocationName
      }
    ) {
      ... on PipelineNotFoundError {
        message
      }
      ... on PartitionSets {
        results {
          id
          name
          mode
          solidSelection
        }
      }
      ...PythonErrorFragment
    }
  }

  ${PYTHON_ERROR_FRAGMENT}
`;
