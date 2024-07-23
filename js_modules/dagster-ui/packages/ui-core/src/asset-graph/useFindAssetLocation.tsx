import {gql, useApolloClient} from '@apollo/client';
import {useCallback} from 'react';

import {isHiddenAssetGroupJob} from './Utils';
import {
  AssetForNavigationQuery,
  AssetForNavigationQueryVariables,
} from './types/useFindAssetLocation.types';
import {AssetKey} from '../assets/types';
import {AssetKeyInput} from '../graphql/types';
import {buildRepoAddress} from '../workspace/buildRepoAddress';
import {RepoAddress} from '../workspace/types';

export interface AssetLocation {
  assetKey: AssetKey;
  opNames: string[];
  jobName: string | null;
  groupName: string | null;
  repoAddress: RepoAddress | null;
}

export function useFindAssetLocation() {
  const apollo = useApolloClient();

  return useCallback(
    async (key: AssetKeyInput): Promise<AssetLocation> => {
      const {data} = await apollo.query<AssetForNavigationQuery, AssetForNavigationQueryVariables>({
        query: ASSET_FOR_NAVIGATION_QUERY,
        variables: {key},
      });
      if (data?.assetOrError.__typename === 'Asset' && data?.assetOrError.definition) {
        const def = data.assetOrError.definition;
        return {
          assetKey: key,
          opNames: def.opNames,
          jobName: def.jobNames.find((jobName) => !isHiddenAssetGroupJob(jobName)) || null,
          groupName: def.groupName,
          repoAddress: def.repository
            ? buildRepoAddress(def.repository.name, def.repository.location.name)
            : null,
        };
      }
      return {assetKey: key, opNames: [], jobName: null, groupName: null, repoAddress: null};
    },
    [apollo],
  );
}

const ASSET_FOR_NAVIGATION_QUERY = gql`
  query AssetForNavigationQuery($key: AssetKeyInput!) {
    assetOrError(assetKey: $key) {
      ... on Asset {
        id
        definition {
          id
          opNames
          jobNames
          groupName
          repository {
            id
            name
            location {
              id
              name
            }
          }
        }
      }
    }
  }
`;
