import {gql, useLazyQuery} from '@apollo/client';
import {
  Box,
  Caption,
  Checkbox,
  Colors,
  IconName,
  MiddleTruncate,
  Tag,
  Tooltip,
} from '@dagster-io/ui-components';
import * as React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components';

import {LoadingOrNone, useDelayedRowQuery} from './VirtualizedWorkspaceTable';
import {RepoAddress} from './types';
import {SingleSensorQuery, SingleSensorQueryVariables} from './types/VirtualizedSensorRow.types';
import {workspacePathFromAddress} from './workspacePath';
import {FIFTEEN_SECONDS, useQueryRefreshAtInterval} from '../app/QueryRefresh';
import {InstigationStatus, SensorType} from '../graphql/types';
import {LastRunSummary} from '../instance/LastRunSummary';
import {TICK_TAG_FRAGMENT} from '../instigation/InstigationTick';
import {BasicInstigationStateFragment} from '../overview/types/BasicInstigationStateFragment.types';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {RUN_TIME_FRAGMENT} from '../runs/RunUtils';
import {humanizeSensorInterval} from '../sensors/SensorDetails';
import {SENSOR_ASSET_SELECTIONS_QUERY} from '../sensors/SensorRoot';
import {SENSOR_SWITCH_FRAGMENT, SensorSwitch} from '../sensors/SensorSwitch';
import {SensorTargetList} from '../sensors/SensorTargetList';
import {
  SensorAssetSelectionQuery,
  SensorAssetSelectionQueryVariables,
} from '../sensors/types/SensorRoot.types';
import {TickStatusTag} from '../ticks/TickStatusTag';
import {HeaderCell, HeaderRow, Row, RowCell} from '../ui/VirtualizedTable';

const TEMPLATE_COLUMNS = '1.5fr 150px 1fr 76px 120px 148px 180px';
const TEMPLATE_COLUMNS_WITH_CHECKBOX = `60px ${TEMPLATE_COLUMNS}`;

interface SensorRowProps {
  name: string;
  repoAddress: RepoAddress;
  checked: boolean;
  onToggleChecked: (values: {checked: boolean; shiftKey: boolean}) => void;
  showCheckboxColumn: boolean;
  sensorState: BasicInstigationStateFragment;
  height: number;
  start: number;
}

export const VirtualizedSensorRow = (props: SensorRowProps) => {
  const {
    name,
    repoAddress,
    checked,
    onToggleChecked,
    showCheckboxColumn,
    sensorState,
    start,
    height,
  } = props;

  const [querySensor, sensorQueryResult] = useLazyQuery<
    SingleSensorQuery,
    SingleSensorQueryVariables
  >(SINGLE_SENSOR_QUERY, {
    variables: {
      selector: {
        repositoryName: repoAddress.name,
        repositoryLocationName: repoAddress.location,
        sensorName: name,
      },
    },
  });

  useBlockTraceOnQueryResult(sensorQueryResult, 'SingleSensorQuery');

  const [querySensorAssetSelection, sensorAssetSelectionQueryResult] = useLazyQuery<
    SensorAssetSelectionQuery,
    SensorAssetSelectionQueryVariables
  >(SENSOR_ASSET_SELECTIONS_QUERY, {
    variables: {
      sensorSelector: {
        repositoryName: repoAddress.name,
        repositoryLocationName: repoAddress.location,
        sensorName: name,
      },
    },
  });

  useBlockTraceOnQueryResult(sensorAssetSelectionQueryResult, 'SensorAssetSelectionQuery');

  useDelayedRowQuery(
    React.useCallback(() => {
      querySensor();
      querySensorAssetSelection();
    }, [querySensor, querySensorAssetSelection]),
  );

  useQueryRefreshAtInterval(sensorQueryResult, FIFTEEN_SECONDS);
  useQueryRefreshAtInterval(sensorAssetSelectionQueryResult, FIFTEEN_SECONDS);

  const {data} = sensorQueryResult;

  const sensorData = React.useMemo(() => {
    if (data?.sensorOrError.__typename !== 'Sensor') {
      return null;
    }

    return data.sensorOrError;
  }, [data]);

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (onToggleChecked && e.target instanceof HTMLInputElement) {
      const {checked} = e.target;
      const shiftKey =
        e.nativeEvent instanceof MouseEvent && e.nativeEvent.getModifierState('Shift');
      onToggleChecked({checked, shiftKey});
    }
  };

  const checkboxState = React.useMemo(() => {
    const {hasStartPermission, hasStopPermission, status} = sensorState;
    if (status === InstigationStatus.RUNNING && !hasStopPermission) {
      return {disabled: true, message: 'You do not have permission to stop this sensor'};
    }
    if (status === InstigationStatus.STOPPED && !hasStartPermission) {
      return {disabled: true, message: 'You do not have permission to start this sensor'};
    }
    return {disabled: false};
  }, [sensorState]);

  const tick = sensorData?.sensorState.ticks[0];

  const sensorType = sensorData?.sensorType;
  const sensorInfo = sensorType ? SENSOR_TYPE_META[sensorType] : null;

  return (
    <Row $height={height} $start={start}>
      <RowGrid border="bottom" $showCheckboxColumn={showCheckboxColumn}>
        {showCheckboxColumn ? (
          <RowCell>
            <Tooltip
              canShow={checkboxState.disabled}
              content={checkboxState.message || ''}
              placement="top"
            >
              <Checkbox disabled={checkboxState.disabled} checked={checked} onChange={onChange} />
            </Tooltip>
          </RowCell>
        ) : null}
        <RowCell>
          <Box flex={{direction: 'column', gap: 4}}>
            <span style={{fontWeight: 500}}>
              <Link to={workspacePathFromAddress(repoAddress, `/sensors/${name}`)}>
                <MiddleTruncate text={name} />
              </Link>
            </span>
            <div
              style={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Caption
                style={{
                  color: Colors.textLight(),
                  whiteSpace: 'nowrap',
                }}
              >
                {sensorData?.description}
              </Caption>
            </div>
          </Box>
        </RowCell>
        <RowCell>
          <div>
            {sensorInfo ? (
              sensorInfo.description ? (
                <Tooltip content={sensorInfo.description}>
                  <Tag icon={sensorInfo.icon}>{sensorInfo.name}</Tag>
                </Tooltip>
              ) : (
                <Tag icon={sensorInfo.icon}>{sensorInfo.name}</Tag>
              )
            ) : null}
          </div>
        </RowCell>
        <RowCell>
          <Box flex={{direction: 'column', gap: 4}} style={{fontSize: '12px'}}>
            {sensorData ? (
              <SensorTargetList
                targets={sensorData.targets}
                repoAddress={repoAddress}
                selectionQueryResult={sensorAssetSelectionQueryResult}
                sensorType={sensorData.sensorType}
              />
            ) : null}
          </Box>
        </RowCell>
        <RowCell>
          {sensorData ? (
            <Box flex={{direction: 'column', gap: 4}}>
              {/* Keyed so that a new switch is always rendered, otherwise it's reused and animates on/off */}
              <SensorSwitch key={name} repoAddress={repoAddress} sensor={sensorData} />
            </Box>
          ) : null}
        </RowCell>
        <RowCell>
          {sensorData ? (
            <div style={{color: Colors.textDefault()}}>
              {humanizeSensorInterval(sensorData.minIntervalSeconds)}
            </div>
          ) : (
            <LoadingOrNone queryResult={sensorQueryResult} />
          )}
        </RowCell>
        <RowCell>
          {tick ? (
            <div>
              <TickStatusTag tick={tick} />
            </div>
          ) : (
            <LoadingOrNone queryResult={sensorQueryResult} />
          )}
        </RowCell>
        <RowCell>
          {sensorData?.sensorState && sensorData?.sensorState.runs[0] ? (
            <LastRunSummary
              run={sensorData.sensorState.runs[0]}
              name={name}
              showButton={false}
              showHover
              showSummary={false}
            />
          ) : (
            <LoadingOrNone queryResult={sensorQueryResult} />
          )}
        </RowCell>
      </RowGrid>
    </Row>
  );
};

export const VirtualizedSensorHeader = ({checkbox}: {checkbox: React.ReactNode}) => {
  return (
    <HeaderRow
      templateColumns={checkbox ? TEMPLATE_COLUMNS_WITH_CHECKBOX : TEMPLATE_COLUMNS}
      sticky
    >
      {checkbox ? (
        <HeaderCell>
          <div style={{position: 'relative', top: '-1px'}}>{checkbox}</div>
        </HeaderCell>
      ) : null}
      <HeaderCell>Name</HeaderCell>
      <HeaderCell>Type</HeaderCell>
      <HeaderCell>Target</HeaderCell>
      <HeaderCell>Running</HeaderCell>
      <HeaderCell>Frequency</HeaderCell>
      <HeaderCell>Last tick</HeaderCell>
      <HeaderCell>Last run</HeaderCell>
    </HeaderRow>
  );
};

const RowGrid = styled(Box)<{$showCheckboxColumn: boolean}>`
  display: grid;
  grid-template-columns: ${({$showCheckboxColumn}) =>
    $showCheckboxColumn ? TEMPLATE_COLUMNS_WITH_CHECKBOX : TEMPLATE_COLUMNS};
  height: 100%;
`;

export const SENSOR_TYPE_META: Record<
  SensorType,
  {name: string; icon: IconName; description: string | null}
> = {
  [SensorType.ASSET]: {
    name: 'Asset',
    icon: 'asset',
    description: 'Asset sensors instigate runs when a materialization occurs',
  },
  [SensorType.AUTO_MATERIALIZE]: {
    name: 'Auto-materialize',
    icon: 'materialization',
    description:
      'Auto-materialize sensors trigger runs based on auto-materialize policies defined on assets.',
  },
  [SensorType.AUTOMATION]: {
    name: 'Automation',
    icon: 'materialization',
    description: 'Automation sensors trigger runs based on conditions defined on assets.',
  },
  [SensorType.FRESHNESS_POLICY]: {
    name: 'Freshness policy',
    icon: 'hourglass',
    description:
      'Freshness sensors check the freshness of assets on each tick, then perform an action in response to that status',
  },
  [SensorType.MULTI_ASSET]: {
    name: 'Multi-asset',
    icon: 'multi_asset',
    description:
      'Multi asset sensors trigger job executions based on multiple asset materialization event streams',
  },
  [SensorType.RUN_STATUS]: {
    name: 'Run status',
    icon: 'alternate_email',
    description: 'Run status sensors react to run status',
  },
  [SensorType.STANDARD]: {
    name: 'Standard',
    icon: 'sensors',
    description: null,
  },
  [SensorType.UNKNOWN]: {
    name: 'Standard',
    icon: 'sensors',
    description: null,
  },
};

export const SINGLE_SENSOR_QUERY = gql`
  query SingleSensorQuery($selector: SensorSelector!) {
    sensorOrError(sensorSelector: $selector) {
      ... on Sensor {
        id
        description
        name
        targets {
          pipelineName
        }
        metadata {
          assetKeys {
            path
          }
        }
        minIntervalSeconds
        description
        sensorState {
          id
          runningCount
          hasStartPermission
          hasStopPermission
          ticks(limit: 1) {
            id
            ...TickTagFragment
          }
          runs(limit: 1) {
            id
            ...RunTimeFragment
          }
          nextTick {
            timestamp
          }
        }
        ...SensorSwitchFragment
      }
    }
  }

  ${TICK_TAG_FRAGMENT}
  ${RUN_TIME_FRAGMENT}
  ${SENSOR_SWITCH_FRAGMENT}
`;
