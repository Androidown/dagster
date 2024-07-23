import {gql, useQuery} from '@apollo/client';
import {Box, Colors, StyledTable, Tag, Tooltip} from '@dagster-io/ui-components';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';

import {LatestRunTagQuery, LatestRunTagQueryVariables} from './types/LatestRunTag.types';
import {FIFTEEN_SECONDS, useQueryRefreshAtInterval} from '../app/QueryRefresh';
import {RunStatus} from '../graphql/types';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {RunStatusIndicator} from '../runs/RunStatusDots';
import {DagsterTag} from '../runs/RunTag';
import {timingStringForStatus} from '../runs/RunTimingDetails';
import {RUN_TIME_FRAGMENT, RunTime} from '../runs/RunUtils';
import {TimestampDisplay} from '../schedules/TimestampDisplay';
import {repoAddressAsTag} from '../workspace/repoAddressAsString';
import {RepoAddress} from '../workspace/types';

const TIME_FORMAT = {showSeconds: true, showTimezone: false};

export const LatestRunTag = ({
  pipelineName,
  repoAddress,
}: {
  pipelineName: string;
  repoAddress: RepoAddress;
}) => {
  const lastRunQuery = useQuery<LatestRunTagQuery, LatestRunTagQueryVariables>(
    LATEST_RUN_TAG_QUERY,
    {
      variables: {
        runsFilter: {
          pipelineName,
          tags: [
            {
              key: DagsterTag.RepositoryLabelTag,
              value: repoAddressAsTag(repoAddress),
            },
          ],
        },
      },
      notifyOnNetworkStatusChange: true,
    },
  );
  useBlockTraceOnQueryResult(lastRunQuery, 'LatestRunTagQuery');

  useQueryRefreshAtInterval(lastRunQuery, FIFTEEN_SECONDS);

  const run = useMemo(() => {
    const runsOrError = lastRunQuery.data?.pipelineRunsOrError;
    if (runsOrError && runsOrError.__typename === 'Runs') {
      return runsOrError.results[0] || null;
    }
    return null;
  }, [lastRunQuery]);

  if (!run) {
    return null;
  }

  const stats = {start: run.startTime, end: run.endTime, status: run.status};
  const intent = () => {
    switch (run.status) {
      case RunStatus.SUCCESS:
        return 'success';
      case RunStatus.CANCELED:
      case RunStatus.CANCELING:
      case RunStatus.FAILURE:
        return 'danger';
      default:
        return 'none';
    }
  };

  return (
    <Tag intent={intent()}>
      <Box flex={{direction: 'row', alignItems: 'center', gap: 4}}>
        <RunStatusIndicator status={run.status} size={10} />
        Latest run:
        {stats ? (
          <Tooltip
            placement="bottom"
            content={
              <StyledTable>
                <tbody>
                  <tr>
                    <td style={{color: Colors.textLighter()}}>
                      <Box padding={{right: 16}}>Started</Box>
                    </td>
                    <td>
                      {stats.start ? (
                        <TimestampDisplay timestamp={stats.start} timeFormat={TIME_FORMAT} />
                      ) : (
                        timingStringForStatus(stats.status)
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{color: Colors.textLighter()}}>Ended</td>
                    <td>
                      {stats.end ? (
                        <TimestampDisplay timestamp={stats.end} timeFormat={TIME_FORMAT} />
                      ) : (
                        timingStringForStatus(stats.status)
                      )}
                    </td>
                  </tr>
                </tbody>
              </StyledTable>
            }
          >
            <Link to={`/runs/${run.id}`}>
              <RunTime run={run} />
            </Link>
          </Tooltip>
        ) : null}
      </Box>
    </Tag>
  );
};

export const LATEST_RUN_TAG_QUERY = gql`
  query LatestRunTagQuery($runsFilter: RunsFilter) {
    pipelineRunsOrError(filter: $runsFilter, limit: 1) {
      ... on Runs {
        results {
          id
          status
          ...RunTimeFragment
        }
      }
    }
  }

  ${RUN_TIME_FRAGMENT}
`;
