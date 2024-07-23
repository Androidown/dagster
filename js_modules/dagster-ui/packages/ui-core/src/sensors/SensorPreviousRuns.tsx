import {gql} from '@apollo/client';
import {CursorHistoryControls} from '@dagster-io/ui-components';
import * as React from 'react';

import {SensorFragment} from './types/SensorFragment.types';
import {
  PreviousRunsForSensorQuery,
  PreviousRunsForSensorQueryVariables,
} from './types/SensorPreviousRuns.types';
import {useQueryRefreshAtInterval} from '../app/QueryRefresh';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {RUN_TABLE_RUN_FRAGMENT, RunTable} from '../runs/RunTable';
import {DagsterTag} from '../runs/RunTag';
import {useCursorPaginatedQuery} from '../runs/useCursorPaginatedQuery';
import {repoAddressAsTag} from '../workspace/repoAddressAsString';
import {RepoAddress} from '../workspace/types';

const RUNS_LIMIT = 20;

export const SensorPreviousRuns = ({
  sensor,
  repoAddress,
  highlightedIds,
  tabs,
}: {
  sensor: SensorFragment;
  repoAddress: RepoAddress;
  tabs?: React.ReactElement;
  highlightedIds?: string[];
}) => {
  const {queryResult, paginationProps} = useCursorPaginatedQuery<
    PreviousRunsForSensorQuery,
    PreviousRunsForSensorQueryVariables
  >({
    query: PREVIOUS_RUNS_FOR_SENSOR_QUERY,
    variables: {
      filter: {
        tags: [
          {key: DagsterTag.SensorName, value: sensor.name},
          {key: DagsterTag.RepositoryLabelTag, value: repoAddressAsTag(repoAddress)},
        ],
      },
    },
    nextCursorForResult: (data) => {
      if (data.pipelineRunsOrError.__typename !== 'Runs') {
        return undefined;
      }
      return data.pipelineRunsOrError.results[RUNS_LIMIT - 1]?.id;
    },
    getResultArray: (data) => {
      if (data?.pipelineRunsOrError.__typename !== 'Runs') {
        return [];
      }
      return data.pipelineRunsOrError.results;
    },
    pageSize: RUNS_LIMIT,
  });
  useBlockTraceOnQueryResult(queryResult, 'PreviousRunsForSensorQuery');
  // Only refresh if we're on the first page
  useQueryRefreshAtInterval(queryResult, !paginationProps.hasPrevCursor ? 10000 : 60 * 60 * 1000);

  let data = queryResult.data;

  if (!data || data?.pipelineRunsOrError.__typename !== 'Runs') {
    // Use previous data to stop the screen from flashing while we wait for the next data to load
    data = queryResult.previousData;
  }
  if (!data || data?.pipelineRunsOrError.__typename !== 'Runs') {
    return null;
  }

  const runs = data.pipelineRunsOrError.results;
  return (
    <>
      <RunTable
        actionBarComponents={tabs}
        runs={runs}
        highlightedIds={highlightedIds}
        hideCreatedBy={true}
      />
      <div style={{paddingBottom: '16px'}}>
        <CursorHistoryControls {...paginationProps} />
      </div>
    </>
  );
};

const PREVIOUS_RUNS_FOR_SENSOR_QUERY = gql`
  query PreviousRunsForSensorQuery($filter: RunsFilter, $cursor: String, $limit: Int) {
    pipelineRunsOrError(filter: $filter, limit: $limit, cursor: $cursor) {
      ... on Runs {
        results {
          id
          ... on PipelineRun {
            ...RunTableRunFragment
          }
        }
      }
    }
  }

  ${RUN_TABLE_RUN_FRAGMENT}
`;
