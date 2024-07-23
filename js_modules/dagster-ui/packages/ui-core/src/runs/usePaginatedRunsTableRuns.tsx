import {gql} from '@apollo/client';

import {RUN_TABLE_RUN_FRAGMENT} from './RunTable';
import {RunsRootQuery, RunsRootQueryVariables} from './types/usePaginatedRunsTableRuns.types';
import {useCursorPaginatedQuery} from './useCursorPaginatedQuery';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {PAGE_SIZE} from '../assets/AutoMaterializePolicyPage/useEvaluationsQueryResult';
import {RunsFilter} from '../graphql/types';

export function usePaginatedRunsTableRuns(filter: RunsFilter) {
  const {queryResult, paginationProps} = useCursorPaginatedQuery<
    RunsRootQuery,
    RunsRootQueryVariables
  >({
    nextCursorForResult: (runs) => {
      if (runs.pipelineRunsOrError.__typename !== 'Runs') {
        return undefined;
      }
      return runs.pipelineRunsOrError.results[PAGE_SIZE - 1]?.id;
    },
    getResultArray: (data) => {
      if (!data || data.pipelineRunsOrError.__typename !== 'Runs') {
        return [];
      }
      return data.pipelineRunsOrError.results;
    },
    variables: {
      filter,
    },
    query: RUNS_ROOT_QUERY,
    pageSize: PAGE_SIZE,
  });
  return {queryResult, paginationProps};
}

export const RUNS_ROOT_QUERY = gql`
  query RunsRootQuery($limit: Int, $cursor: String, $filter: RunsFilter!) {
    pipelineRunsOrError(limit: $limit, cursor: $cursor, filter: $filter) {
      ... on Runs {
        results {
          id
          ...RunTableRunFragment
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
