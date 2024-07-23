// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type AssetMaterializationUpstreamTableFragment = {
  __typename: 'AssetNode';
  assetMaterializationUsedData: Array<{
    __typename: 'MaterializationUpstreamDataVersion';
    timestamp: string;
    assetKey: {__typename: 'AssetKey'; path: Array<string>};
    downstreamAssetKey: {__typename: 'AssetKey'; path: Array<string>};
  }>;
};

export type MaterializationUpstreamDataVersionFragment = {
  __typename: 'MaterializationUpstreamDataVersion';
  timestamp: string;
  assetKey: {__typename: 'AssetKey'; path: Array<string>};
  downstreamAssetKey: {__typename: 'AssetKey'; path: Array<string>};
};

export type AssetMaterializationUpstreamQueryVariables = Types.Exact<{
  assetKey: Types.AssetKeyInput;
  timestamp: Types.Scalars['String']['input'];
}>;

export type AssetMaterializationUpstreamQuery = {
  __typename: 'Query';
  assetNodeOrError:
    | {
        __typename: 'AssetNode';
        id: string;
        assetMaterializationUsedData: Array<{
          __typename: 'MaterializationUpstreamDataVersion';
          timestamp: string;
          assetKey: {__typename: 'AssetKey'; path: Array<string>};
          downstreamAssetKey: {__typename: 'AssetKey'; path: Array<string>};
        }>;
      }
    | {__typename: 'AssetNotFoundError'};
};
