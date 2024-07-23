import {
  Box,
  Button,
  Checkbox,
  Colors,
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
  MiddleTruncate,
  TagSelectorDropdownItemProps,
  TagSelectorDropdownProps,
  TagSelectorWithSearch,
} from '@dagster-io/ui-components';
import * as React from 'react';
import styled from 'styled-components';

import {CreatePartitionDialog} from './CreatePartitionDialog';
import {DimensionRangeInput} from './DimensionRangeInput';
import {PartitionStatus, PartitionStatusHealthSource} from './PartitionStatus';
import {AssetPartitionStatusDot} from '../assets/AssetPartitionList';
import {partitionStatusAtIndex} from '../assets/usePartitionHealthData';
import {PartitionDefinitionType, RunStatus} from '../graphql/types';
import {RunStatusDot} from '../runs/RunStatusDots';
import {testId} from '../testing/testId';
import {RepoAddress} from '../workspace/types';

export const DimensionRangeWizard = ({
  selected,
  setSelected,
  partitionKeys,
  health,
  dimensionType,
  partitionDefinitionName,
  repoAddress,
  refetch,
}: {
  selected: string[];
  setSelected: (selected: string[]) => void;
  partitionKeys: string[];
  health: PartitionStatusHealthSource;
  dimensionType: PartitionDefinitionType;
  partitionDefinitionName?: string | null;
  repoAddress?: RepoAddress;
  refetch?: () => Promise<void>;
}) => {
  const isTimeseries = dimensionType === PartitionDefinitionType.TIME_WINDOW;
  const isDynamic = dimensionType === PartitionDefinitionType.DYNAMIC;

  const [showCreatePartition, setShowCreatePartition] = React.useState(false);

  return (
    <>
      <Box flex={{direction: 'row', alignItems: 'center', gap: 8}} padding={{vertical: 4}}>
        <Box flex={{direction: 'column'}} style={{flex: 1}}>
          {isTimeseries ? (
            <DimensionRangeInput
              value={selected}
              partitionKeys={partitionKeys}
              onChange={setSelected}
              isTimeseries={isTimeseries}
            />
          ) : (
            <OrdinalPartitionSelector
              allPartitions={partitionKeys}
              selectedPartitions={selected}
              setSelectedPartitions={setSelected}
              health={health}
              setShowCreatePartition={setShowCreatePartition}
              isDynamic={isDynamic}
            />
          )}
        </Box>
        {isTimeseries && (
          <Button
            small={true}
            onClick={() => setSelected(partitionKeys.slice(-1))}
            data-testid={testId('latest-partition-button')}
          >
            Latest
          </Button>
        )}
        <Button small={true} onClick={() => setSelected(partitionKeys)}>
          All
        </Button>
      </Box>
      <Box margin={{bottom: 8}}>
        {isDynamic && (
          <LinkText
            flex={{direction: 'row', alignItems: 'center', gap: 8}}
            onClick={() => {
              setShowCreatePartition(true);
            }}
            data-testid={testId('add-partition-link')}
          >
            <StyledIcon name="add" size={24} />
            <div>Add a partition</div>
          </LinkText>
        )}
        {isTimeseries && (
          <PartitionStatus
            partitionNames={partitionKeys}
            health={health}
            splitPartitions={!isTimeseries}
            selected={selected}
            onSelect={setSelected}
          />
        )}
      </Box>
      {repoAddress && (
        <CreatePartitionDialog
          key={showCreatePartition ? '1' : '0'}
          isOpen={showCreatePartition}
          partitionDefinitionName={partitionDefinitionName}
          repoAddress={repoAddress}
          close={() => {
            setShowCreatePartition(false);
          }}
          refetch={refetch}
          onCreated={(partitionName) => {
            setSelected([...selected, partitionName]);
          }}
        />
      )}
    </>
  );
};

const OrdinalPartitionSelector = ({
  allPartitions,
  selectedPartitions,
  setSelectedPartitions,
  setShowCreatePartition,
  isDynamic,
  health,
}: {
  allPartitions: string[];
  selectedPartitions: string[];
  setSelectedPartitions: (tags: string[]) => void;
  health: PartitionStatusHealthSource;
  setShowCreatePartition: (show: boolean) => void;
  isDynamic: boolean;
}) => {
  const dotForPartitionKey = React.useCallback(
    (partitionKey: string) => {
      const index = allPartitions.indexOf(partitionKey);
      if ('ranges' in health) {
        return <AssetPartitionStatusDot status={partitionStatusAtIndex(health.ranges, index)} />;
      } else {
        return (
          <RunStatusDot
            size={10}
            status={health.runStatusForPartitionKey(partitionKey, index) || RunStatus.NOT_STARTED}
          />
        );
      }
    },
    [allPartitions, health],
  );

  return (
    <>
      <TagSelectorWithSearch
        allTags={allPartitions}
        selectedTags={selectedPartitions}
        setSelectedTags={setSelectedPartitions}
        placeholder="Select a partition or create one"
        renderDropdownItem={React.useCallback(
          (tag: string, dropdownItemProps: TagSelectorDropdownItemProps) => {
            return (
              <label>
                <MenuItem
                  tagName="div"
                  text={
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto auto minmax(0, 1fr)',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <Checkbox
                        checked={dropdownItemProps.selected}
                        onChange={dropdownItemProps.toggle}
                      />
                      {dotForPartitionKey(tag)}
                      <div data-tooltip={tag} data-tooltip-style={DropdownItemTooltipStyle}>
                        <MiddleTruncate text={tag} />
                      </div>
                    </div>
                  }
                />
              </label>
            );
          },
          [dotForPartitionKey],
        )}
        renderDropdown={React.useCallback(
          (dropdown: React.ReactNode, {width, allTags}: TagSelectorDropdownProps) => {
            const isAllSelected = allTags.every((t) => selectedPartitions.includes(t));
            return (
              <Menu style={{width}}>
                <Box padding={4}>
                  {isDynamic && (
                    <>
                      <Box flex={{direction: 'column'}}>
                        <MenuItem
                          tagName="div"
                          text={
                            <Box flex={{direction: 'row', alignItems: 'center', gap: 12}}>
                              <StyledIcon name="add" size={24} />
                              <span>Add partition</span>
                            </Box>
                          }
                          onClick={() => {
                            setShowCreatePartition(true);
                          }}
                        />
                      </Box>
                      <MenuDivider />
                    </>
                  )}
                  {allTags.length ? (
                    <>
                      <label>
                        <MenuItem
                          tagName="div"
                          text={
                            <Box flex={{alignItems: 'center', gap: 12}}>
                              <Checkbox
                                checked={isAllSelected}
                                onChange={() => {
                                  if (isAllSelected) {
                                    setSelectedPartitions([]);
                                  } else {
                                    setSelectedPartitions(allTags);
                                  }
                                }}
                              />
                              <span>Select all ({allTags.length})</span>
                            </Box>
                          }
                        />
                      </label>
                      {dropdown}
                    </>
                  ) : (
                    <div style={{padding: '6px 6px 0px 6px', color: Colors.textLight()}}>
                      No matching partitions found
                    </div>
                  )}
                </Box>
              </Menu>
            );
          },
          [isDynamic, selectedPartitions, setSelectedPartitions, setShowCreatePartition],
        )}
        renderTagList={(tags) => {
          if (tags.length > 4) {
            return <span>{tags.length} partitions selected</span>;
          }
          return tags;
        }}
        searchPlaceholder="Filter partitions"
      />
    </>
  );
};

const StyledIcon = styled(Icon)`
  font-weight: 500;
`;

const LinkText = styled(Box)`
  color: ${Colors.linkDefault()};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
  > * {
    height: 24px;
    align-content: center;
    line-height: 24px;
  }
`;

const DropdownItemTooltipStyle = JSON.stringify({
  background: Colors.backgroundLight(),
  border: `1px solid ${Colors.borderDefault()}`,
  color: Colors.textDefault(),
  fontSize: '14px',
});
