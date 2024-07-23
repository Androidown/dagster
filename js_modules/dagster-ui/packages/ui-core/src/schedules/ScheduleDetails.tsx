import {
  Box,
  Button,
  Code,
  Group,
  Heading,
  MetadataTableWIP,
  PageHeader,
  Tag,
} from '@dagster-io/ui-components';
import {useState} from 'react';

import {SchedulePartitionStatus} from './SchedulePartitionStatus';
import {ScheduleResetButton} from './ScheduleResetButton';
import {ScheduleSwitch} from './ScheduleSwitch';
import {TimestampDisplay} from './TimestampDisplay';
import {humanCronString} from './humanCronString';
import {ScheduleFragment} from './types/ScheduleUtils.types';
import {QueryRefreshCountdown, QueryRefreshState} from '../app/QueryRefresh';
import {InstigationStatus} from '../graphql/types';
import {RepositoryLink} from '../nav/RepositoryLink';
import {PipelineReference} from '../pipelines/PipelineReference';
import {EvaluateScheduleDialog} from '../ticks/EvaluateScheduleDialog';
import {TickStatusTag} from '../ticks/TickStatusTag';
import {isThisThingAJob, useRepository} from '../workspace/WorkspaceContext';
import {RepoAddress} from '../workspace/types';

const TIME_FORMAT = {showSeconds: true, showTimezone: true};

export const ScheduleDetails = (props: {
  schedule: ScheduleFragment;
  repoAddress: RepoAddress;
  refreshState: QueryRefreshState;
}) => {
  const {repoAddress, schedule, refreshState} = props;
  const {cronSchedule, executionTimezone, futureTicks, name, partitionSet, pipelineName} = schedule;
  const {scheduleState} = schedule;
  const {status, ticks} = scheduleState;
  const latestTick = ticks.length > 0 ? ticks[0] : null;
  const running = status === InstigationStatus.RUNNING;

  const repo = useRepository(repoAddress);
  const isJob = isThisThingAJob(repo, pipelineName);

  const [showTestTickDialog, setShowTestTickDialog] = useState(false);

  return (
    <>
      <PageHeader
        title={<Heading>{name}</Heading>}
        tags={
          <Tag icon="schedule">
            Schedule in <RepositoryLink repoAddress={repoAddress} />
          </Tag>
        }
        right={
          <Box flex={{direction: 'row', alignItems: 'center', gap: 8}}>
            <QueryRefreshCountdown refreshState={refreshState} />
            <Button
              onClick={() => {
                setShowTestTickDialog(true);
              }}
            >
              Test Schedule
            </Button>
          </Box>
        }
      />
      <EvaluateScheduleDialog
        key={showTestTickDialog ? '1' : '0'} // change key to reset dialog state
        isOpen={showTestTickDialog}
        onClose={() => {
          setShowTestTickDialog(false);
        }}
        name={schedule.name}
        repoAddress={repoAddress}
        jobName={pipelineName}
      />
      <MetadataTableWIP>
        <tbody>
          {schedule.description ? (
            <tr>
              <td>Description</td>
              <td>{schedule.description}</td>
            </tr>
          ) : null}
          <tr>
            <td>Latest tick</td>
            <td>
              {latestTick ? (
                <Group direction="row" spacing={8} alignItems="center">
                  <TimestampDisplay
                    timestamp={latestTick.timestamp}
                    timezone={executionTimezone}
                    timeFormat={TIME_FORMAT}
                  />
                  <TickStatusTag tick={latestTick} />
                </Group>
              ) : (
                'Schedule has never run'
              )}
            </td>
          </tr>
          {futureTicks.results[0] && running && (
            <tr>
              <td>Next tick</td>
              <td>
                <TimestampDisplay
                  timestamp={futureTicks.results[0].timestamp!}
                  timezone={executionTimezone}
                  timeFormat={TIME_FORMAT}
                />
              </td>
            </tr>
          )}
          <tr>
            <td>{isJob ? 'Job' : 'Pipeline'}</td>
            <td>
              <PipelineReference
                pipelineName={pipelineName}
                pipelineHrefContext={repoAddress}
                isJob={isJob}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Box flex={{alignItems: 'center'}} style={{height: '32px'}}>
                Running
              </Box>
            </td>
            <td>
              <Box
                flex={{direction: 'row', gap: 12, alignItems: 'center'}}
                style={{height: '32px'}}
              >
                <ScheduleSwitch repoAddress={repoAddress} schedule={schedule} />
                {schedule.canReset && (
                  <ScheduleResetButton repoAddress={repoAddress} schedule={schedule} />
                )}
              </Box>
            </td>
          </tr>
          <tr>
            <td>Partition set</td>
            <td>
              {partitionSet ? (
                <SchedulePartitionStatus schedule={schedule} repoAddress={repoAddress} />
              ) : (
                'None'
              )}
            </td>
          </tr>
          <tr>
            <td>Schedule</td>
            <td>
              {cronSchedule ? (
                <Group direction="row" spacing={8}>
                  <span>{humanCronString(cronSchedule, executionTimezone || 'UTC')}</span>
                  <Code>({cronSchedule})</Code>
                </Group>
              ) : (
                <div>&mdash;</div>
              )}
            </td>
          </tr>
          {executionTimezone ? (
            <tr>
              <td>Execution timezone</td>
              <td>{executionTimezone}</td>
            </tr>
          ) : null}
        </tbody>
      </MetadataTableWIP>
    </>
  );
};
