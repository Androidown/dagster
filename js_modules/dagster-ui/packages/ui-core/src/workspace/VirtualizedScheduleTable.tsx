import {useVirtualizer} from '@tanstack/react-virtual';
import * as React from 'react';

import {VirtualizedScheduleHeader, VirtualizedScheduleRow} from './VirtualizedScheduleRow';
import {RepoAddress} from './types';
import {BasicInstigationStateFragment} from '../overview/types/BasicInstigationStateFragment.types';
import {makeScheduleKey} from '../schedules/makeScheduleKey';
import {Container, Inner} from '../ui/VirtualizedTable';

type ScheduleInfo = {name: string; scheduleState: BasicInstigationStateFragment};

interface Props {
  repoAddress: RepoAddress;
  schedules: ScheduleInfo[];
  headerCheckbox: React.ReactNode;
  checkedKeys: Set<string>;
  onToggleCheckFactory: (path: string) => (values: {checked: boolean; shiftKey: boolean}) => void;
}

export const VirtualizedScheduleTable = ({
  repoAddress,
  schedules,
  headerCheckbox,
  checkedKeys,
  onToggleCheckFactory,
}: Props) => {
  const parentRef = React.useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: schedules.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const totalHeight = rowVirtualizer.getTotalSize();
  const items = rowVirtualizer.getVirtualItems();

  return (
    <div style={{overflow: 'hidden'}}>
      <Container ref={parentRef}>
        <VirtualizedScheduleHeader checkbox={headerCheckbox} />
        <Inner $totalHeight={totalHeight}>
          {items.map(({index, key, size, start}) => {
            const row: ScheduleInfo = schedules[index]!;
            const scheduleKey = makeScheduleKey(repoAddress, row.name);
            return (
              <VirtualizedScheduleRow
                key={key}
                name={row.name}
                repoAddress={repoAddress}
                scheduleState={row.scheduleState}
                checked={checkedKeys.has(scheduleKey)}
                showCheckboxColumn={!!headerCheckbox}
                onToggleChecked={onToggleCheckFactory(scheduleKey)}
                height={size}
                start={start}
              />
            );
          })}
        </Inner>
      </Container>
    </div>
  );
};
