import {gql} from '@apollo/client';
import {Box, Checkbox, Group, Spinner, Table, Tag} from '@dagster-io/ui-components';

import {DaemonHealth} from './DaemonHealth';
import {DaemonStatusForListFragment} from './types/DaemonList.types';
import {useConfirmation} from '../app/CustomConfirmationProvider';
import {useUnscopedPermissions} from '../app/Permissions';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {Timestamp} from '../app/time/Timestamp';
import {AutoMaterializeExperimentalTag} from '../assets/AutoMaterializePolicyPage/AutoMaterializeExperimentalBanner';
import {useAutoMaterializeSensorFlag} from '../assets/AutoMaterializeSensorFlag';
import {useAutomaterializeDaemonStatus} from '../assets/useAutomaterializeDaemonStatus';
import {testId} from '../testing/testId';
import {TimeFromNow} from '../ui/TimeFromNow';

interface DaemonLabelProps {
  daemon: DaemonStatusForListFragment;
}

const DaemonLabel = (props: DaemonLabelProps) => {
  const {daemon} = props;
  switch (daemon.daemonType) {
    case 'SCHEDULER':
      return <div>Scheduler</div>;
    case 'SENSOR':
      return <div>Sensors</div>;
    case 'QUEUED_RUN_COORDINATOR':
      return <div>Run queue</div>;
    case 'BACKFILL':
      return <div>Backfill</div>;
    default:
      return (
        <div style={{textTransform: 'capitalize'}}>
          {daemon.daemonType.replace(/_/g, ' ').toLowerCase()}
        </div>
      );
  }
};

interface Props {
  daemonStatuses: DaemonStatusForListFragment[] | undefined;
  showTimestampColumn?: boolean;
}

const TIME_FORMAT = {showSeconds: true, showTimezone: false};

export const DaemonList = ({daemonStatuses, showTimestampColumn = true}: Props) => {
  const automaterialize = useAutomaterializeDaemonStatus();
  const assetDaemon = daemonStatuses?.filter((daemon) => daemon.daemonType === 'ASSET')[0];
  const nonAssetDaemons = daemonStatuses?.filter((daemon) => daemon.daemonType !== 'ASSET');

  const hasGlobalAMP = useAutoMaterializeSensorFlag() === 'has-global-amp';

  const confirm = useConfirmation();

  const {permissions: {canToggleAutoMaterialize} = {}} = useUnscopedPermissions();

  return (
    <Table>
      <thead>
        <tr>
          <th style={{width: '30%'}}>Daemon</th>
          <th style={{width: '20%'}}>Status</th>
          {showTimestampColumn && <th>Last heartbeat</th>}
        </tr>
      </thead>
      <tbody>
        {assetDaemon ? (
          <tr>
            <td>
              <Box flex={{direction: 'row', justifyContent: 'space-between'}}>
                <Box flex={{gap: 8, alignItems: 'center'}}>
                  Auto-materializing
                  <AutoMaterializeExperimentalTag />
                </Box>
                {automaterialize.loading ? (
                  <div data-testid={testId('loading-spinner')}>
                    <Spinner purpose="body-text" />
                  </div>
                ) : hasGlobalAMP ? (
                  <Checkbox
                    format="switch"
                    checked={!automaterialize.paused}
                    disabled={!canToggleAutoMaterialize}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      if (!checked) {
                        await confirm({
                          title: 'Pause Auto-materializing?',
                          description:
                            'Pausing Auto-materializing will prevent new materializations triggered by an Auto-materializing policy.',
                        });
                      }
                      automaterialize.setPaused(!checked);
                    }}
                  />
                ) : null}
              </Box>
            </td>
            <td>
              {automaterialize.paused ? (
                <Tag intent="warning">Paused</Tag>
              ) : (
                <DaemonHealth daemon={assetDaemon} />
              )}
            </td>
            {showTimestampColumn && (
              <td>
                {assetDaemon.lastHeartbeatTime ? (
                  <Group direction="row" spacing={4}>
                    <Timestamp
                      timestamp={{unix: assetDaemon.lastHeartbeatTime}}
                      timeFormat={TIME_FORMAT}
                    />
                    <span>
                      (<TimeFromNow unixTimestamp={assetDaemon.lastHeartbeatTime} />)
                    </span>
                  </Group>
                ) : (
                  'Never'
                )}
              </td>
            )}
          </tr>
        ) : null}
        {nonAssetDaemons
          ?.filter((daemon) => daemon.required)
          .map((daemon) => {
            return (
              <tr key={daemon.daemonType}>
                <td>
                  <DaemonLabel daemon={daemon} />
                </td>
                <td>
                  <DaemonHealth daemon={daemon} />
                </td>
                {showTimestampColumn && (
                  <td>
                    {daemon.lastHeartbeatTime ? (
                      <Group direction="row" spacing={4}>
                        <Timestamp
                          timestamp={{unix: daemon.lastHeartbeatTime}}
                          timeFormat={TIME_FORMAT}
                        />
                        <span>
                          (<TimeFromNow unixTimestamp={daemon.lastHeartbeatTime} />)
                        </span>
                      </Group>
                    ) : (
                      'Never'
                    )}
                  </td>
                )}
              </tr>
            );
          })}
      </tbody>
    </Table>
  );
};

export const DAEMON_HEALTH_FRAGMENT = gql`
  fragment DaemonHealthFragment on DaemonHealth {
    id
    allDaemonStatuses {
      id
      ...DaemonStatusForList
    }
  }

  fragment DaemonStatusForList on DaemonStatus {
    id
    daemonType
    required
    healthy
    lastHeartbeatErrors {
      ...PythonErrorFragment
    }
    lastHeartbeatTime
  }

  ${PYTHON_ERROR_FRAGMENT}
`;
