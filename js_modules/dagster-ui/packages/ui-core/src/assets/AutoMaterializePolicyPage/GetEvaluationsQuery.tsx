import {gql} from '@apollo/client';

import {METADATA_ENTRY_FRAGMENT} from '../../metadata/MetadataEntryFragment';

const AssetSubsetFragment = gql`
  fragment AssetSubsetFragment on AssetSubset {
    subsetValue {
      isPartitioned
      partitionKeys
      partitionKeyRanges {
        start
        end
      }
    }
  }
`;

const SpecificPartitionAssetConditionEvaluationNodeFragment = gql`
  fragment SpecificPartitionAssetConditionEvaluationNodeFragment on SpecificPartitionAssetConditionEvaluationNode {
    description
    status
    uniqueId
    childUniqueIds
    metadataEntries {
      ...MetadataEntryFragment
    }
  }
  ${METADATA_ENTRY_FRAGMENT}
`;

const UnpartitionedAssetConditionEvaluationNodeFragment = gql`
  fragment UnpartitionedAssetConditionEvaluationNodeFragment on UnpartitionedAssetConditionEvaluationNode {
    description
    startTimestamp
    endTimestamp
    status
    uniqueId
    childUniqueIds
    metadataEntries {
      ...MetadataEntryFragment
    }
  }
  ${METADATA_ENTRY_FRAGMENT}
`;
const PartitionedAssetConditionEvaluationNodeFragment = gql`
  fragment PartitionedAssetConditionEvaluationNodeFragment on PartitionedAssetConditionEvaluationNode {
    description
    startTimestamp
    endTimestamp
    numTrue
    numFalse
    numSkipped
    trueSubset {
      ...AssetSubsetFragment
    }
    candidateSubset {
      ...AssetSubsetFragment
    }
    uniqueId
    childUniqueIds
  }
  ${AssetSubsetFragment}
`;

const NEW_EVALUATION_NODE_FRAGMENT = gql`
  fragment NewEvaluationNodeFragment on AutomationConditionEvaluationNode {
    uniqueId
    expandedLabel
    userLabel
    startTimestamp
    endTimestamp
    numTrue
    isPartitioned
    childUniqueIds
    trueSubset {
      ...AssetSubsetFragment
    }
    candidateSubset {
      ...AssetSubsetFragment
    }
  }

  ${AssetSubsetFragment}
`;

const AssetConditionEvaluationRecordFragment = gql`
  fragment AssetConditionEvaluationRecordFragment on AssetConditionEvaluationRecord {
    id
    evaluationId
    numRequested
    assetKey {
      path
    }
    runIds
    timestamp
    startTimestamp
    endTimestamp
    isLegacy
    evaluation {
      rootUniqueId
      evaluationNodes {
        ...UnpartitionedAssetConditionEvaluationNodeFragment
        ...PartitionedAssetConditionEvaluationNodeFragment
        ...SpecificPartitionAssetConditionEvaluationNodeFragment
      }
    }
    evaluationNodes {
      ...NewEvaluationNodeFragment
    }
  }

  ${UnpartitionedAssetConditionEvaluationNodeFragment}
  ${PartitionedAssetConditionEvaluationNodeFragment}
  ${SpecificPartitionAssetConditionEvaluationNodeFragment}
  ${NEW_EVALUATION_NODE_FRAGMENT}
`;

export const GET_EVALUATIONS_QUERY = gql`
  query GetEvaluationsQuery($assetKey: AssetKeyInput!, $limit: Int!, $cursor: String) {
    assetNodeOrError(assetKey: $assetKey) {
      __typename
      ... on AssetNode {
        id
        autoMaterializePolicy {
          rules {
            description
            decisionType
            className
          }
        }
        currentAutoMaterializeEvaluationId
      }
    }

    assetConditionEvaluationRecordsOrError(assetKey: $assetKey, limit: $limit, cursor: $cursor) {
      ... on AssetConditionEvaluationRecords {
        records {
          id
          ...AssetConditionEvaluationRecordFragment
        }
      }
      ... on AutoMaterializeAssetEvaluationNeedsMigrationError {
        message
      }
    }
  }
  ${AssetConditionEvaluationRecordFragment}
`;

export const GET_EVALUATIONS_SPECIFIC_PARTITION_QUERY = gql`
  query GetEvaluationsSpecificPartitionQuery(
    $assetKey: AssetKeyInput!
    $evaluationId: Int!
    $partition: String!
  ) {
    assetConditionEvaluationForPartition(
      assetKey: $assetKey
      evaluationId: $evaluationId
      partition: $partition
    ) {
      rootUniqueId
      evaluationNodes {
        ...UnpartitionedAssetConditionEvaluationNodeFragment
        ...PartitionedAssetConditionEvaluationNodeFragment
        ...SpecificPartitionAssetConditionEvaluationNodeFragment
      }
    }
  }

  ${UnpartitionedAssetConditionEvaluationNodeFragment}
  ${PartitionedAssetConditionEvaluationNodeFragment}
  ${SpecificPartitionAssetConditionEvaluationNodeFragment}
`;
