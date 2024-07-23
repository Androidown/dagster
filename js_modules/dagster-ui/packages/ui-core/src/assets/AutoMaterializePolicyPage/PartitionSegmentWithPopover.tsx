import {
  Box,
  Colors,
  Menu,
  MenuItem,
  MiddleTruncate,
  Popover,
  Tag,
  TextInput,
  TextInputContainer,
} from '@dagster-io/ui-components';
import {useVirtualizer} from '@tanstack/react-virtual';
import {useMemo, useRef, useState} from 'react';
import styled from 'styled-components';

import {PolicyEvaluationStatusTag} from './PolicyEvaluationStatusTag';
import {assertUnreachable} from '../../app/Util';
import {AssetConditionEvaluationStatus, AssetSubsetValue} from '../../graphql/types';
import {Container, Inner, Row} from '../../ui/VirtualizedTable';
import {numberFormatter} from '../../ui/formatters';

const statusToColors = (status: AssetConditionEvaluationStatus) => {
  switch (status) {
    case AssetConditionEvaluationStatus.TRUE:
      return {color: Colors.accentGreen(), hoverColor: Colors.accentGreenHover()};
    case AssetConditionEvaluationStatus.FALSE:
      return {color: Colors.accentYellow(), hoverColor: Colors.accentYellowHover()};
    case AssetConditionEvaluationStatus.SKIPPED:
      return {color: Colors.accentGray(), hoverColor: Colors.accentGrayHover()};
    default:
      return assertUnreachable(status);
  }
};

type AssetSusbsetWithoutTypenames = {
  subsetValue: Omit<AssetSubsetValue, '__typename' | 'boolValue'>;
};

interface Props {
  description: string;
  subset: AssetSusbsetWithoutTypenames | null;
  selectPartition?: (partitionKey: string | null) => void;
}

export const PartitionSegmentWithPopover = ({description, selectPartition, subset}: Props) => {
  if (!subset) {
    return null;
  }

  const count = subset.subsetValue.partitionKeys?.length || 0;

  const tag = (
    <Tag intent={count > 0 ? 'success' : 'none'} icon={count > 0 ? 'check_circle' : undefined}>
      {numberFormatter.format(count)} True
    </Tag>
  );

  if (count === 0) {
    return tag;
  }

  return (
    <Popover
      interactionKind="hover"
      placement="bottom"
      hoverOpenDelay={50}
      hoverCloseDelay={50}
      content={
        <PartitionSubsetList
          description={description}
          status={AssetConditionEvaluationStatus.TRUE}
          subset={subset}
          selectPartition={selectPartition}
        />
      }
    >
      {tag}
    </Popover>
  );
};

interface ListProps {
  description: string;
  status?: AssetConditionEvaluationStatus;
  subset: AssetSusbsetWithoutTypenames;
  selectPartition?: (partitionKey: string | null) => void;
}

const ITEM_HEIGHT = 32;
const MAX_ITEMS_BEFORE_TRUNCATION = 4;

export const PartitionSubsetList = ({description, status, subset, selectPartition}: ListProps) => {
  const container = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const {color, hoverColor} = useMemo(
    () => statusToColors(status ?? AssetConditionEvaluationStatus.TRUE),
    [status],
  );

  const partitionKeys = useMemo(() => subset.subsetValue.partitionKeys || [], [subset]);

  const filteredKeys = useMemo(() => {
    const searchLower = searchValue.toLocaleLowerCase();
    return partitionKeys.filter((key) => key.toLocaleLowerCase().includes(searchLower));
  }, [partitionKeys, searchValue]);

  const count = filteredKeys.length;

  const rowVirtualizer = useVirtualizer({
    count: filteredKeys.length,
    getScrollElement: () => container.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  });

  const totalHeight = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div style={{width: '292px'}}>
      <Box
        padding={{vertical: 8, left: 12, right: 8}}
        border="bottom"
        flex={{direction: 'row', alignItems: 'center', justifyContent: 'space-between'}}
        style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8}}
      >
        <strong>
          <MiddleTruncate text={description} />
        </strong>
        {status ? <PolicyEvaluationStatusTag status={status} /> : null}
      </Box>
      {partitionKeys.length > MAX_ITEMS_BEFORE_TRUNCATION ? (
        <SearchContainer padding={{vertical: 4, horizontal: 8}}>
          <TextInput
            icon="search"
            placeholder="Filter partitions…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </SearchContainer>
      ) : null}
      <div
        style={{
          height: count > MAX_ITEMS_BEFORE_TRUNCATION ? '150px' : count * ITEM_HEIGHT + 16,
          overflow: 'hidden',
        }}
      >
        <Container ref={container}>
          <Menu>
            <Inner $totalHeight={totalHeight}>
              {virtualItems.map(({index, key, size, start}) => {
                const partitionKey = filteredKeys[index]!;
                return (
                  <Row $height={size} $start={start} key={key}>
                    <MenuItem
                      onClick={() => {
                        selectPartition && selectPartition(partitionKey);
                      }}
                      text={
                        <Box flex={{direction: 'row', alignItems: 'center', gap: 8}}>
                          <PartitionStatusDot $color={color} $hoverColor={hoverColor} />
                          <div>
                            <MiddleTruncate text={partitionKey} />
                          </div>
                        </Box>
                      }
                    />
                  </Row>
                );
              })}
            </Inner>
          </Menu>
        </Container>
      </div>
    </div>
  );
};

const SearchContainer = styled(Box)`
  display: flex;
  ${TextInputContainer} {
    flex: 1;
  }
`;

const PartitionStatusDot = styled.div<{$color: string; $hoverColor: string}>`
  background-color: ${({$color}) => $color};
  height: 8px;
  width: 8px;
  border-radius: 50%;
  transition: background-color 100ms linear;

  :hover {
    background-color: ${({$hoverColor}) => $hoverColor};
  }
`;
