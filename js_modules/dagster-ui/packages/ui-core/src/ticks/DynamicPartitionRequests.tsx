import {Box, Colors, Icon, Subheading, Table, Tag} from '@dagster-io/ui-components';
import {useMemo} from 'react';

import {DynamicPartitionRequestFragment} from './types/SensorDryRunDialog.types';
import {DynamicPartitionsRequestType} from '../graphql/types';

export function DynamicPartitionRequests({
  includeTitle = true,
  requests,
}: {
  includeTitle?: boolean;
  requests: Pick<DynamicPartitionRequestFragment, 'partitionKeys' | 'partitionsDefName' | 'type'>[];
}) {
  const rows = useMemo(() => {
    if (!requests.length) {
      return [];
    }
    const rows: {key: string; def: string; type: DynamicPartitionsRequestType}[] = [];
    requests.forEach(({partitionKeys, partitionsDefName, type}) => {
      partitionKeys?.forEach((key) => {
        rows.push({
          key,
          def: partitionsDefName,
          type,
        });
      });
    });
    return rows;
  }, [requests]);

  if (!rows.length) {
    return null;
  }

  return (
    <Box flex={{direction: 'column', gap: 12, grow: 1}}>
      {includeTitle ? (
        <Box flex={{direction: 'row', alignItems: 'center', gap: 8}}>
          <Icon name="partition" />
          <Subheading>Dynamic Partition Requests</Subheading>
        </Box>
      ) : null}
      <Table style={{borderRight: `1px solid ${Colors.keylineDefault()}`}}>
        <thead>
          <tr>
            <th>Partition</th>
            <th>Partition definition</th>
            <th>Requested change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({key, def, type}, index) => {
            return (
              <tr key={index}>
                <td>{key}</td>
                <td>{def}</td>
                <td>
                  {type === DynamicPartitionsRequestType.ADD_PARTITIONS ? (
                    <Tag intent="success">
                      <span>Add Partition</span>
                    </Tag>
                  ) : (
                    <Tag intent="danger">
                      <span>Delete Partition</span>
                    </Tag>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Box>
  );
}
