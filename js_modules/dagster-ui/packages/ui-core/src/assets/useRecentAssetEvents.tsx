import {gql, useQuery} from '@apollo/client';
import uniq from 'lodash/uniq';
import {useMemo} from 'react';

import {ASSET_LINEAGE_FRAGMENT} from './AssetLineageElements';
import {AssetKey, AssetViewParams} from './types';
import {AssetEventsQuery, AssetEventsQueryVariables} from './types/useRecentAssetEvents.types';
import {METADATA_ENTRY_FRAGMENT} from '../metadata/MetadataEntryFragment';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';

/**
The params behavior on this page is a bit nuanced - there are two main query
params: ?timestamp= and ?partition= and only one is set at a time. They can
be undefined, an empty string or a value and all three states are used.

- If both are undefined, we expand the first item in the table by default
- If one is present, it determines which xAxis is used (partition grouping)
- If one is present and set to a value, that item in the table is expanded.
- If one is present but an empty string, no items in the table is expanded.
 */
export function getXAxisForParams(
  params: Pick<AssetViewParams, 'asOf' | 'partition' | 'time'>,
  {defaultToPartitions}: {defaultToPartitions: boolean},
) {
  const xAxisDefault = defaultToPartitions ? 'partition' : 'time';
  const xAxis: 'partition' | 'time' =
    params.partition !== undefined
      ? 'partition'
      : params.time !== undefined || params.asOf
      ? 'time'
      : xAxisDefault;

  return xAxis;
}

/**
 * If the asset has a defined partition space, we load all materializations in the
 * last 100 partitions. This ensures that if you run a huge backfill of old partitions,
 * you still see accurate info for the last 100 partitions in the UI. A count-based
 * limit could cause random partitions to disappear if materializations were out of order.
 */
export function useRecentAssetEvents(
  assetKey: AssetKey | undefined,
  params: Pick<AssetViewParams, 'asOf' | 'partition' | 'time'>,
  {assetHasDefinedPartitions}: {assetHasDefinedPartitions: boolean},
) {
  const before = params.asOf ? `${Number(params.asOf) + 1}` : undefined;
  const xAxis = getXAxisForParams(params, {defaultToPartitions: assetHasDefinedPartitions});

  const loadUsingPartitionKeys = assetHasDefinedPartitions && xAxis === 'partition';

  const queryResult = useQuery<AssetEventsQuery, AssetEventsQueryVariables>(ASSET_EVENTS_QUERY, {
    skip: !assetKey,
    fetchPolicy: 'cache-and-network',
    variables: loadUsingPartitionKeys
      ? {
          assetKey: {path: assetKey?.path ?? []},
          before,
          partitionInLast: 120,
        }
      : {
          assetKey: {path: assetKey?.path ?? []},
          before,
          limit: 100,
        },
  });
  const {data, loading, refetch} = queryResult;
  useBlockTraceOnQueryResult(queryResult, 'AssetEventsQuery', {skip: !assetKey});

  const value = useMemo(() => {
    const asset = data?.assetOrError.__typename === 'Asset' ? data?.assetOrError : null;
    const materializations = asset?.assetMaterializations || [];
    const observations = asset?.assetObservations || [];

    const allPartitionKeys = asset?.definition?.partitionKeys;
    const loadedPartitionKeys =
      loadUsingPartitionKeys && allPartitionKeys
        ? allPartitionKeys.slice(allPartitionKeys.length - 120)
        : uniq(
            [...materializations, ...observations].map((p) => p.partition!).filter(Boolean),
          ).sort();

    return {
      asset,
      loadedPartitionKeys,
      materializations,
      observations,
      loading,
      refetch,
      xAxis,
    };
  }, [data, loading, refetch, loadUsingPartitionKeys, xAxis]);

  return value;
}

export type RecentAssetEvents = ReturnType<typeof useRecentAssetEvents>;

export const ASSET_MATERIALIZATION_FRAGMENT = gql`
  fragment AssetMaterializationFragment on MaterializationEvent {
    partition
    tags {
      key
      value
    }
    runOrError {
      ... on PipelineRun {
        id
        mode
        repositoryOrigin {
          id
          repositoryName
          repositoryLocationName
        }
        status
        pipelineName
        pipelineSnapshotId
      }
    }
    runId
    timestamp
    stepKey
    label
    description
    metadataEntries {
      ...MetadataEntryFragment
    }
    assetLineage {
      ...AssetLineageFragment
    }
  }

  ${METADATA_ENTRY_FRAGMENT}
  ${ASSET_LINEAGE_FRAGMENT}
`;

export const ASSET_OBSERVATION_FRAGMENT = gql`
  fragment AssetObservationFragment on ObservationEvent {
    partition
    tags {
      key
      value
    }
    runOrError {
      ... on PipelineRun {
        id
        mode
        repositoryOrigin {
          id
          repositoryName
          repositoryLocationName
        }
        status
        pipelineName
        pipelineSnapshotId
      }
    }
    runId
    timestamp
    stepKey
    label
    description
    metadataEntries {
      ...MetadataEntryFragment
    }
  }

  ${METADATA_ENTRY_FRAGMENT}
`;

export const ASSET_EVENTS_QUERY = gql`
  query AssetEventsQuery(
    $assetKey: AssetKeyInput!
    $limit: Int
    $before: String
    $partitionInLast: Int
  ) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        assetObservations(
          limit: $limit
          beforeTimestampMillis: $before
          partitionInLast: $partitionInLast
        ) {
          ...AssetObservationFragment
        }
        assetMaterializations(
          limit: $limit
          beforeTimestampMillis: $before
          partitionInLast: $partitionInLast
        ) {
          ...AssetMaterializationFragment
        }

        definition {
          id
          partitionKeys
        }
      }
    }
  }

  ${ASSET_OBSERVATION_FRAGMENT}
  ${ASSET_MATERIALIZATION_FRAGMENT}
`;
