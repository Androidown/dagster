import {useVirtualizer} from '@tanstack/react-virtual';
import {useRef} from 'react';

import {VirtualizedResourceHeader, VirtualizedResourceRow} from './VirtualizedResourceRow';
import {ResourceEntryFragment} from './types/WorkspaceResourcesRoot.types';
import {Container, Inner} from '../ui/VirtualizedTable';
import {RepoAddress} from '../workspace/types';

interface Props {
  repoAddress: RepoAddress;
  resources: ResourceEntryFragment[];
}

export const VirtualizedResourceTable = ({repoAddress, resources}: Props) => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: resources.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const totalHeight = rowVirtualizer.getTotalSize();
  const items = rowVirtualizer.getVirtualItems();

  return (
    <div style={{overflow: 'hidden'}}>
      <Container ref={parentRef}>
        <VirtualizedResourceHeader />
        <Inner $totalHeight={totalHeight}>
          {items.map(({index, key, size, start}) => {
            const row: ResourceEntryFragment = resources[index]!;
            return (
              <VirtualizedResourceRow
                key={key}
                repoAddress={repoAddress}
                height={size}
                start={start}
                {...row}
              />
            );
          })}
        </Inner>
      </Container>
    </div>
  );
};
