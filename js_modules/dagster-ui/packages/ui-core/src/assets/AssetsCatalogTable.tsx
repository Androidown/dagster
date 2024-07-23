import {gql, useApolloClient} from '@apollo/client';
import {Box, ButtonGroup} from '@dagster-io/ui-components';
import * as React from 'react';
import {useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {useRouteMatch} from 'react-router-dom';
import {useSetRecoilState} from 'recoil';

import {AssetCatalogTableBottomActionBar} from './AssetCatalogTableBottomActionBar';
import {AssetTable} from './AssetTable';
import {ASSET_TABLE_DEFINITION_FRAGMENT, ASSET_TABLE_FRAGMENT} from './AssetTableFragment';
import {AssetsEmptyState} from './AssetsEmptyState';
import {AssetTableFragment} from './types/AssetTableFragment.types';
import {
  AssetCatalogGroupTableNodeFragment,
  AssetCatalogGroupTableQuery,
  AssetCatalogGroupTableQueryVariables,
  AssetCatalogTableQuery,
  AssetCatalogTableQueryVariables,
} from './types/AssetsCatalogTable.types';
import {useAssetCatalogFiltering} from './useAssetCatalogFiltering';
import {AssetViewType, useAssetView} from './useAssetView';
import {AppContext} from '../app/AppContext';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {PythonErrorInfo} from '../app/PythonErrorInfo';
import {FIFTEEN_SECONDS, useRefreshAtInterval} from '../app/QueryRefresh';
import {currentPageAtom} from '../app/analytics';
import {PythonErrorFragment} from '../app/types/PythonErrorFragment.types';
import {AssetGroupSelector} from '../graphql/types';
import {useUpdatingRef} from '../hooks/useUpdatingRef';
import {PageLoadTrace} from '../performance';
import {useBlockTraceUntilTrue} from '../performance/TraceContext';
import {fetchPaginatedData} from '../runs/fetchPaginatedBucketData';
import {CacheManager} from '../search/useIndexedDBCachedQuery';
import {LoadingSpinner} from '../ui/Loading';

type Asset = AssetTableFragment;

const groupTableCache = new Map();
const emptyArray: string[] = [];

export const ASSET_CATALOG_TABLE_QUERY_VERSION = 1;
const DEFAULT_BATCH_LIMIT = 10000;

export function useCachedAssets({
  onAssetsLoaded,
}: {
  onAssetsLoaded: (data: AssetTableFragment[]) => void;
}) {
  const {localCacheIdPrefix} = useContext(AppContext);
  const cacheManager = useMemo(
    () => new CacheManager<AssetTableFragment[]>(`${localCacheIdPrefix}/allAssetNodes`),
    [localCacheIdPrefix],
  );

  useLayoutEffect(() => {
    cacheManager.get(ASSET_CATALOG_TABLE_QUERY_VERSION).then((data) => {
      if (data) {
        onAssetsLoaded(data);
      }
    });
  }, [cacheManager, onAssetsLoaded]);

  return {cacheManager};
}
const requery = () => [{query: ASSET_CATALOG_TABLE_QUERY, fetchPolicy: 'no-cache' as const}];

export function useAllAssets({
  batchLimit = DEFAULT_BATCH_LIMIT,
  groupSelector,
}: {groupSelector?: AssetGroupSelector; batchLimit?: number} = {}) {
  const client = useApolloClient();
  const [{error, assets}, setErrorAndAssets] = useState<{
    error: PythonErrorFragment | undefined;
    assets: Asset[] | undefined;
  }>({error: undefined, assets: undefined});

  const assetsRef = useUpdatingRef(assets);

  const {cacheManager} = useCachedAssets({
    onAssetsLoaded: useCallback(
      (data) => {
        if (!assetsRef.current) {
          setErrorAndAssets({
            error: undefined,
            assets: data,
          });
        }
      },
      [assetsRef],
    ),
  });

  const fetchAssets = useCallback(async () => {
    try {
      const data = await fetchPaginatedData({
        async fetchData(cursor: string | undefined) {
          const {data} = await client.query<
            AssetCatalogTableQuery,
            AssetCatalogTableQueryVariables
          >({
            query: ASSET_CATALOG_TABLE_QUERY,
            fetchPolicy: 'no-cache',
            variables: {
              cursor,
              limit: batchLimit,
            },
          });

          if (data.assetsOrError.__typename === 'PythonError') {
            return {
              data: [],
              cursor: undefined,
              hasMore: false,
              error: data.assetsOrError,
            };
          }
          const assets = data.assetsOrError.nodes;
          const hasMoreData = assets.length === batchLimit;
          const nextCursor = hasMoreData ? assets[assets.length - 1]!.id : undefined;
          return {
            data: assets,
            cursor: nextCursor,
            hasMore: hasMoreData,
            error: undefined,
          };
        },
      });
      cacheManager.set(data, ASSET_CATALOG_TABLE_QUERY_VERSION);
      setErrorAndAssets({error: undefined, assets: data});
    } catch (e: any) {
      if (e.__typename === 'PythonError') {
        setErrorAndAssets(({assets}) => ({
          error: e,
          assets,
        }));
      }
    }
  }, [batchLimit, cacheManager, client]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const groupQuery = useCallback(async () => {
    if (!groupSelector) {
      return;
    }
    function onData(queryData: typeof data) {
      setErrorAndAssets({
        error: undefined,
        assets: queryData.assetNodes?.map(definitionToAssetTableFragment),
      });
    }
    const cacheKey = JSON.stringify(groupSelector);
    if (groupTableCache.has(cacheKey)) {
      onData(groupTableCache.get(cacheKey));
    }
    const {data} = await client.query<
      AssetCatalogGroupTableQuery,
      AssetCatalogGroupTableQueryVariables
    >({
      query: ASSET_CATALOG_GROUP_TABLE_QUERY,
      variables: {group: groupSelector},
      fetchPolicy: 'no-cache',
    });
    groupTableCache.set(cacheKey, data);
    onData(data);
  }, [groupSelector, client]);

  return useMemo(() => {
    return {
      assets,
      error,
      loading: !assets && !error,
      query: groupSelector ? groupQuery : fetchAssets,
    };
  }, [assets, error, fetchAssets, groupQuery, groupSelector]);
}

interface AssetCatalogTableProps {
  prefixPath: string[];
  setPrefixPath: (prefixPath: string[]) => void;
  groupSelector?: AssetGroupSelector;
  trace?: PageLoadTrace;
}

export const AssetsCatalogTable = ({
  prefixPath,
  setPrefixPath,
  groupSelector,
  trace,
}: AssetCatalogTableProps) => {
  const setCurrentPage = useSetRecoilState(currentPageAtom);
  const {path} = useRouteMatch();
  useEffect(() => {
    setCurrentPage(({specificPath}) => ({specificPath, path: `${path}?view=AssetCatalogTable`}));
  }, [path, setCurrentPage]);

  const [view, setView] = useAssetView();

  const {assets, query, error} = useAllAssets({groupSelector});
  const {
    searchPath,
    filtered,
    isFiltered,
    filterButton,
    filterInput,
    activeFiltersJsx,
    computeKindFilter,
    storageKindFilter,
  } = useAssetCatalogFiltering(assets, prefixPath);

  useBlockTraceUntilTrue('useAllAssets', !!assets?.length);

  const {displayPathForAsset, displayed} = useMemo(
    () =>
      view === 'flat'
        ? buildFlatProps(filtered, prefixPath)
        : buildNamespaceProps(filtered, prefixPath),
    [filtered, prefixPath, view],
  );

  const refreshState = useRefreshAtInterval({
    refresh: query,
    intervalMs: FIFTEEN_SECONDS,
    leading: true,
  });

  const loaded = !!assets;
  useEffect(() => {
    if (loaded) {
      trace?.endTrace();
    }
  }, [loaded, trace]);

  React.useEffect(() => {
    if (view !== 'directory' && prefixPath.length) {
      setView('directory');
    }
  }, [view, setView, prefixPath]);

  if (error) {
    return <PythonErrorInfo error={error} />;
  }

  if (!assets) {
    return <LoadingSpinner purpose="page" />;
  }

  if (!assets.length) {
    return (
      <Box padding={{vertical: 64}}>
        <AssetsEmptyState prefixPath={prefixPath} />
      </Box>
    );
  }

  return (
    <AssetTable
      view={view}
      assets={displayed}
      isFiltered={isFiltered}
      actionBarComponents={
        <>
          <ButtonGroup<AssetViewType>
            activeItems={new Set([view])}
            buttons={[
              {id: 'flat', icon: 'view_list', tooltip: 'List view'},
              {id: 'directory', icon: 'folder', tooltip: 'Folder view'},
            ]}
            onClick={(view) => {
              setView(view);
              if (view === 'flat' && prefixPath.length) {
                setPrefixPath([]);
              }
            }}
          />
          {filterButton}
          {filterInput}
        </>
      }
      belowActionBarComponents={
        <AssetCatalogTableBottomActionBar activeFiltersJsx={activeFiltersJsx} />
      }
      refreshState={refreshState}
      prefixPath={prefixPath || emptyArray}
      searchPath={searchPath}
      displayPathForAsset={displayPathForAsset}
      requery={requery}
      computeKindFilter={computeKindFilter}
      storageKindFilter={storageKindFilter}
    />
  );
};

export const ASSET_CATALOG_TABLE_QUERY = gql`
  query AssetCatalogTableQuery($cursor: String, $limit: Int!) {
    assetsOrError(cursor: $cursor, limit: $limit) {
      ... on AssetConnection {
        nodes {
          id
          ...AssetTableFragment
        }
      }
      ...PythonErrorFragment
    }
  }

  ${ASSET_TABLE_FRAGMENT}
  ${PYTHON_ERROR_FRAGMENT}
`;

export const ASSET_CATALOG_GROUP_TABLE_QUERY = gql`
  query AssetCatalogGroupTableQuery($group: AssetGroupSelector) {
    assetNodes(group: $group) {
      id
      ...AssetCatalogGroupTableNode
    }
  }

  fragment AssetCatalogGroupTableNode on AssetNode {
    id
    assetKey {
      path
    }
    ...AssetTableDefinitionFragment
  }

  ${ASSET_TABLE_DEFINITION_FRAGMENT}
`;

// When we load the AssetCatalogTable for a particular asset group, we retrieve `assetNodes`,
// not `assets`. To narrow the scope of this difference we coerce the nodes to look like
// AssetCatalogTableQuery results.
function definitionToAssetTableFragment(definition: AssetCatalogGroupTableNodeFragment): Asset {
  return {__typename: 'Asset', id: definition.id, key: definition.assetKey, definition};
}

function buildFlatProps(assets: Asset[], _: string[]) {
  return {
    displayed: assets,
    displayPathForAsset: (asset: Asset) => asset.key.path,
  };
}

function buildNamespaceProps(assets: Asset[], prefixPath: string[]) {
  // Return all assets matching prefixPath - the AssetTable component will later
  // group them by namespace

  const namespaceForAsset = (asset: Asset) => {
    return asset.key.path.slice(prefixPath.length, prefixPath.length + 1);
  };

  const assetsWithPathPrefix = assets.filter((asset) =>
    prefixPath.every((part, index) => part === asset.key.path[index]),
  );

  return {
    displayPathForAsset: namespaceForAsset,
    displayed: assetsWithPathPrefix,
  };
}
