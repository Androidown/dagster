import {gql, useQuery} from '@apollo/client';
import {NonIdealState, Spinner} from '@dagster-io/ui-components';

import {
  PartitionRunListQuery,
  PartitionRunListQueryVariables,
} from './types/PartitionRunList.types';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {RUN_TABLE_RUN_FRAGMENT, RunTable} from '../runs/RunTable';
import {DagsterTag} from '../runs/RunTag';

interface PartitionRunListProps {
  pipelineName: string;
  partitionName: string;
}

export const PartitionRunList = (props: PartitionRunListProps) => {
  const queryResult = useQuery<PartitionRunListQuery, PartitionRunListQueryVariables>(
    PARTITION_RUN_LIST_QUERY,
    {
      variables: {
        filter: {
          pipelineName: props.pipelineName,
          tags: [{key: DagsterTag.Partition, value: props.partitionName}],
        },
      },
    },
  );

  useBlockTraceOnQueryResult(queryResult, 'PartitionRunListQuery');
  const {data, loading} = queryResult;

  if (loading || !data) {
    return <Spinner purpose="section" />;
  }

  if (data.pipelineRunsOrError.__typename !== 'Runs') {
    return (
      <NonIdealState
        icon="error"
        title="Query Error"
        description={data.pipelineRunsOrError.message}
      />
    );
  }
  return (
    <div>
      <RunTable runs={data.pipelineRunsOrError.results} />
    </div>
  );
};

const PARTITION_RUN_LIST_QUERY = gql`
  query PartitionRunListQuery($filter: RunsFilter!) {
    pipelineRunsOrError(filter: $filter, limit: 500) {
      ... on PipelineRuns {
        results {
          ...RunTableRunFragment
          id
        }
      }
      ... on InvalidPipelineRunsFilterError {
        message
      }
      ...PythonErrorFragment
    }
  }

  ${RUN_TABLE_RUN_FRAGMENT}
  ${PYTHON_ERROR_FRAGMENT}
`;
