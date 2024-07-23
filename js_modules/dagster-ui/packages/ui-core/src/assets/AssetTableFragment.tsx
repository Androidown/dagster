import {gql} from '@apollo/client';

export const ASSET_TABLE_DEFINITION_FRAGMENT = gql`
  fragment AssetTableDefinitionFragment on AssetNode {
    id
    changedReasons
    groupName
    opNames
    isSource
    isObservable
    isExecutable
    computeKind
    hasMaterializePermission
    partitionDefinition {
      description
    }
    description
    owners {
      ... on UserAssetOwner {
        email
      }
      ... on TeamAssetOwner {
        team
      }
    }
    tags {
      key
      value
    }
    repository {
      id
      name
      location {
        id
        name
      }
    }
  }
`;

export const ASSET_TABLE_FRAGMENT = gql`
  fragment AssetTableFragment on Asset {
    id
    key {
      path
    }
    definition {
      id
      ...AssetTableDefinitionFragment
    }
  }

  ${ASSET_TABLE_DEFINITION_FRAGMENT}
`;
