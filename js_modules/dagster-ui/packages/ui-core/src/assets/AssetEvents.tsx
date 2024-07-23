import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Colors,
  ErrorBoundary,
  Icon,
  Menu,
  MenuItem,
  Popover,
  Spinner,
  Subheading,
} from '@dagster-io/ui-components';
import * as React from 'react';

import {AssetEventDetail, AssetEventDetailEmpty} from './AssetEventDetail';
import {AssetEventList} from './AssetEventList';
import {AssetPartitionDetail, AssetPartitionDetailEmpty} from './AssetPartitionDetail';
import {CurrentRunsBanner} from './CurrentRunsBanner';
import {FailedRunSinceMaterializationBanner} from './FailedRunSinceMaterializationBanner';
import {AssetEventGroup, useGroupedEvents} from './groupByPartition';
import {AssetKey, AssetViewParams} from './types';
import {AssetViewDefinitionNodeFragment} from './types/AssetView.types';
import {usePaginatedAssetEvents} from './usePaginatedAssetEvents';
import {getXAxisForParams} from './useRecentAssetEvents';
import {LiveDataForNode, stepKeyForAsset} from '../asset-graph/Utils';
import {RepositorySelector} from '../graphql/types';
import {useStateWithStorage} from '../hooks/useStateWithStorage';

interface Props {
  assetKey: AssetKey;
  assetNode: AssetViewDefinitionNodeFragment | null;
  liveData?: LiveDataForNode;
  params: AssetViewParams;
  paramsTimeWindowOnly: boolean;
  setParams: (params: AssetViewParams) => void;

  // This timestamp is a "hint", when it changes this component will refetch
  // to retrieve new data. Just don't want to poll the entire table query.
  dataRefreshHint: string | undefined;

  repository?: RepositorySelector;
  opName?: string | null;
}

export const AssetEvents = ({
  assetKey,
  assetNode,
  params,
  setParams,
  liveData,
  dataRefreshHint,
}: Props) => {
  /**
   * We have a separate "Asset > Partitions" tab, but that is only available for SDAs with
   * pre-defined partitions. For non-SDAs, this Events page still displays a "Time | Partition"
   * picker and this xAxis can still be `partitions`!
   *
   * The partitions behavior in this case isn't ideal because the UI only "sees" partition names
   * in the events it has fetched. Users should upgrade to SDAs for a better experience.
   *
   * To test this easily, unload / break your code location so your SDA becomes a non-SDA :-)
   */
  const xAxis = getXAxisForParams(params, {defaultToPartitions: false});
  const {materializations, observations, loadedPartitionKeys, fetchMore, fetchLatest, loading} =
    usePaginatedAssetEvents(assetKey, params);

  React.useEffect(() => {
    fetchLatest();
  }, [params.asOf, dataRefreshHint, fetchLatest]);

  const [filters, setFilters] = useStateWithStorage<{types: EventType[]}>(
    'asset-event-filters',
    (json) => ({types: json?.types || ALL_EVENT_TYPES}),
  );

  // Source assets never have materializations, so we don't want to show the type filter
  const hideFilters = assetNode?.isSource;
  // Source assets never have a partitions tab, so we shouldn't allow links to it
  const hidePartitionLinks = assetNode?.isSource;

  const grouped = useGroupedEvents(
    xAxis,
    hideFilters || filters.types.includes('materialization') ? materializations : [],
    hideFilters || filters.types.includes('observation') ? observations : [],
    loadedPartitionKeys,
  );

  const onSetFocused = (group: AssetEventGroup | undefined) => {
    const updates: Partial<AssetViewParams> =
      xAxis === 'time'
        ? {time: group?.timestamp !== params.time ? group?.timestamp || '' : ''}
        : {partition: group?.partition !== params.partition ? group?.partition || '' : ''};
    setParams({...params, ...updates});
  };

  const focused: AssetEventGroup | undefined =
    grouped.find((b) =>
      params.time
        ? Number(b.timestamp) <= Number(params.time)
        : params.partition
        ? b.partition === params.partition
        : false,
    ) || grouped[0];

  // Note: This page still has a LOT of logic for displaying events by partition but it's only enabled
  // in one case -- when the asset is an old-school, non-software-defined asset with partition keys
  // on it's materializations but no defined partition set.
  //
  const assetHasUndefinedPartitions =
    !assetNode?.partitionDefinition && grouped.some((g) => g.partition);
  const assetHasLineage = materializations.some((m) => m.assetLineage.length > 0);

  const onKeyDown = (e: React.KeyboardEvent<any>) => {
    const shift = {ArrowDown: 1, ArrowUp: -1}[e.key];
    if (!shift || !focused || e.isDefaultPrevented()) {
      return;
    }
    const next = grouped[grouped.indexOf(focused) + shift];
    if (next) {
      e.preventDefault();
      onSetFocused(next);
    }
  };

  return (
    <>
      {assetHasUndefinedPartitions && (
        <Box
          flex={{justifyContent: 'space-between', alignItems: 'center'}}
          border="bottom"
          padding={{vertical: 16, horizontal: 24}}
          style={{marginBottom: -1}}
        >
          <Subheading>Asset Events</Subheading>
          <div style={{margin: '-6px 0 '}}>
            <ButtonGroup
              activeItems={new Set([xAxis])}
              buttons={[
                {id: 'partition', label: 'By partition'},
                {id: 'time', label: 'By timestamp'},
              ]}
              onClick={(id: string) =>
                setParams(
                  id === 'time'
                    ? {...params, partition: undefined, time: focused?.timestamp || ''}
                    : {...params, partition: focused?.partition || '', time: undefined},
                )
              }
            />
          </div>
        </Box>
      )}

      {assetNode && !assetNode.partitionDefinition && (
        <>
          <FailedRunSinceMaterializationBanner
            stepKey={stepKeyForAsset(assetNode)}
            border="bottom"
            run={liveData?.runWhichFailedToMaterialize || null}
          />
          <CurrentRunsBanner
            stepKey={stepKeyForAsset(assetNode)}
            border="bottom"
            liveData={liveData}
          />
        </>
      )}

      <Box
        style={{flex: 1, minHeight: 0, outline: 'none'}}
        flex={{direction: 'row'}}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <Box
          style={{display: 'flex', flex: 1, minWidth: 200}}
          flex={{direction: 'column'}}
          background={Colors.backgroundLight()}
        >
          {hideFilters ? undefined : (
            <Box
              flex={{alignItems: 'center', gap: 16}}
              padding={{vertical: 12, horizontal: 24}}
              border="bottom"
            >
              <EventTypeSelect
                value={filters.types}
                onChange={(types) => setFilters({...filters, types})}
              />
            </Box>
          )}
          {loading && grouped.length === 0 ? (
            <Box flex={{alignItems: 'center', justifyContent: 'center'}} style={{flex: 1}}>
              <Spinner purpose="section" />
            </Box>
          ) : (
            <AssetEventList
              xAxis={xAxis}
              groups={grouped}
              focused={focused}
              setFocused={onSetFocused}
              assetKey={assetKey}
              loading={loading}
              onLoadMore={fetchMore}
            />
          )}
        </Box>

        <Box
          flex={{direction: 'column'}}
          style={{flex: 3, minWidth: 0, overflowY: 'auto'}}
          border="left"
        >
          <ErrorBoundary region="event" resetErrorOnChange={[focused]}>
            {xAxis === 'partition' ? (
              focused ? (
                <AssetPartitionDetail
                  group={focused}
                  hasLineage={assetHasLineage}
                  assetKey={assetKey}
                  stepKey={assetNode ? stepKeyForAsset(assetNode) : undefined}
                  latestRunForPartition={null}
                  changedReasons={assetNode?.changedReasons}
                />
              ) : (
                <AssetPartitionDetailEmpty />
              )
            ) : focused?.latest ? (
              <AssetEventDetail
                assetKey={assetKey}
                event={focused.latest}
                hidePartitionLinks={hidePartitionLinks}
              />
            ) : (
              <AssetEventDetailEmpty />
            )}
          </ErrorBoundary>
        </Box>
      </Box>
    </>
  );
};

type EventType = 'observation' | 'materialization';

const ALL_EVENT_TYPES: EventType[] = ['observation', 'materialization'];

export const EventTypeSelect = ({
  value,
  onChange,
}: {
  value: EventType[];
  onChange: (value: EventType[]) => void;
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const onToggle = (type: EventType) => {
    if (value.includes(type)) {
      onChange(value.filter((v) => v !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <Popover
      isOpen={showMenu}
      placement="bottom-start"
      canEscapeKeyClose
      onInteraction={(nextOpenState: boolean) => setShowMenu(nextOpenState)}
      content={
        <Menu style={{width: 140}} aria-label="filter-options">
          <MenuItem
            shouldDismissPopover={false}
            onClick={() => onToggle('materialization')}
            text={
              <Box padding={{horizontal: 2}} flex={{direction: 'row', alignItems: 'center'}}>
                <Checkbox
                  size="small"
                  checked={value.includes('materialization')}
                  onChange={() => {}}
                  label="Materialization"
                />
              </Box>
            }
          />
          <MenuItem
            shouldDismissPopover={false}
            onClick={() => onToggle('observation')}
            text={
              <Box padding={{horizontal: 2}} flex={{direction: 'row', alignItems: 'center'}}>
                <Checkbox
                  size="small"
                  checked={value.includes('observation')}
                  onChange={() => {}}
                  label="Observation"
                />
              </Box>
            }
          />
        </Menu>
      }
    >
      <Button
        onClick={() => setShowMenu((current) => !current)}
        icon={<Icon name="filter_alt" />}
        rightIcon={<Icon name="expand_more" />}
      >
        Type ({value.length})
      </Button>
    </Popover>
  );
};
