import {gql, useQuery} from '@apollo/client';
import {NonIdealState, Page, Tab, Tabs} from '@dagster-io/ui-components';
import * as React from 'react';
import {useParams} from 'react-router-dom';

import {ScheduleDetails} from './ScheduleDetails';
import {SCHEDULE_FRAGMENT} from './ScheduleUtils';
import {SchedulerInfo} from './SchedulerInfo';
import {
  PreviousRunsForScheduleQuery,
  PreviousRunsForScheduleQueryVariables,
  ScheduleRootQuery,
  ScheduleRootQueryVariables,
} from './types/ScheduleRoot.types';
import {ScheduleFragment} from './types/ScheduleUtils.types';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {FIFTEEN_SECONDS, useQueryRefreshAtInterval} from '../app/QueryRefresh';
import {useTrackPageView} from '../app/analytics';
import {useDocumentTitle} from '../hooks/useDocumentTitle';
import {INSTANCE_HEALTH_FRAGMENT} from '../instance/InstanceHealthFragment';
import {TicksTable} from '../instigation/TickHistory';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {RUN_TABLE_RUN_FRAGMENT, RunTable} from '../runs/RunTable';
import {DagsterTag} from '../runs/RunTag';
import {Loading} from '../ui/Loading';
import {repoAddressAsTag} from '../workspace/repoAddressAsString';
import {repoAddressToSelector} from '../workspace/repoAddressToSelector';
import {RepoAddress} from '../workspace/types';

interface Props {
  repoAddress: RepoAddress;
}

export const ScheduleRoot = (props: Props) => {
  useTrackPageView();

  const {repoAddress} = props;
  const {scheduleName} = useParams<{scheduleName: string}>();

  useDocumentTitle(`Schedule: ${scheduleName}`);

  const scheduleSelector = {
    ...repoAddressToSelector(repoAddress),
    scheduleName,
  };

  const [selectedTab, setSelectedTab] = React.useState<string>('ticks');

  const queryResult = useQuery<ScheduleRootQuery, ScheduleRootQueryVariables>(SCHEDULE_ROOT_QUERY, {
    variables: {
      scheduleSelector,
    },
    notifyOnNetworkStatusChange: true,
  });

  useBlockTraceOnQueryResult(queryResult, 'ScheduleRootQuery');

  const refreshState = useQueryRefreshAtInterval(queryResult, FIFTEEN_SECONDS);

  const tabs = (
    <Tabs selectedTabId={selectedTab} onChange={setSelectedTab}>
      <Tab id="ticks" title="Tick history" />
      <Tab id="runs" title="Run history" />
    </Tabs>
  );

  return (
    <Loading queryResult={queryResult} allowStaleData={true}>
      {({scheduleOrError, instance}) => {
        if (scheduleOrError.__typename !== 'Schedule') {
          return null;
        }

        const showDaemonWarning = !instance.daemonHealth.daemonStatus.healthy;

        return (
          <Page>
            <ScheduleDetails
              repoAddress={repoAddress}
              schedule={scheduleOrError}
              refreshState={refreshState}
            />
            {showDaemonWarning ? (
              <SchedulerInfo
                daemonHealth={instance.daemonHealth}
                padding={{vertical: 16, horizontal: 24}}
              />
            ) : null}
            {selectedTab === 'ticks' ? (
              <TicksTable tabs={tabs} repoAddress={repoAddress} name={scheduleOrError.name} />
            ) : (
              <SchedulePreviousRuns
                repoAddress={repoAddress}
                schedule={scheduleOrError}
                tabs={tabs}
              />
            )}
          </Page>
        );
      }}
    </Loading>
  );
};

const SchedulePreviousRuns = ({
  repoAddress,
  schedule,
  highlightedIds,
  tabs,
}: {
  repoAddress: RepoAddress;
  schedule: ScheduleFragment;
  tabs?: React.ReactElement;
  highlightedIds?: string[];
}) => {
  const queryResult = useQuery<PreviousRunsForScheduleQuery, PreviousRunsForScheduleQueryVariables>(
    PREVIOUS_RUNS_FOR_SCHEDULE_QUERY,
    {
      variables: {
        limit: 20,
        filter: {
          tags: [
            {key: DagsterTag.ScheduleName, value: schedule.name},
            {key: DagsterTag.RepositoryLabelTag, value: repoAddressAsTag(repoAddress)},
          ],
        },
      },
      notifyOnNetworkStatusChange: true,
    },
  );

  useQueryRefreshAtInterval(queryResult, FIFTEEN_SECONDS);
  const {data} = queryResult;

  if (!data) {
    return null;
  } else if (data.pipelineRunsOrError.__typename !== 'Runs') {
    return (
      <NonIdealState
        icon="error"
        title="Query Error"
        description={data.pipelineRunsOrError.message}
      />
    );
  }

  const runs = data?.pipelineRunsOrError.results;
  return (
    <RunTable
      actionBarComponents={tabs}
      runs={runs}
      highlightedIds={highlightedIds}
      hideCreatedBy={true}
    />
  );
};

const SCHEDULE_ROOT_QUERY = gql`
  query ScheduleRootQuery($scheduleSelector: ScheduleSelector!) {
    scheduleOrError(scheduleSelector: $scheduleSelector) {
      ... on Schedule {
        id
        ...ScheduleFragment
      }
      ... on ScheduleNotFoundError {
        message
      }
      ...PythonErrorFragment
    }
    instance {
      id
      daemonHealth {
        id
        daemonStatus(daemonType: "SCHEDULER") {
          id
          healthy
        }
      }
      ...InstanceHealthFragment
    }
  }

  ${SCHEDULE_FRAGMENT}
  ${PYTHON_ERROR_FRAGMENT}
  ${INSTANCE_HEALTH_FRAGMENT}
`;

const PREVIOUS_RUNS_FOR_SCHEDULE_QUERY = gql`
  query PreviousRunsForScheduleQuery($filter: RunsFilter, $limit: Int) {
    pipelineRunsOrError(filter: $filter, limit: $limit) {
      ... on Runs {
        results {
          id
          ... on PipelineRun {
            ...RunTableRunFragment
          }
        }
      }
      ... on Error {
        message
      }
    }
  }

  ${RUN_TABLE_RUN_FRAGMENT}
`;
