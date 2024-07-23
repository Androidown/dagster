import {MockedProvider} from '@apollo/client/testing';
import {renderHook, waitFor} from '@testing-library/react';
import {cache as mockedCache} from 'idb-lru-cache';

import {Asset, buildAsset, buildAssetConnection} from '../../graphql/types';
import {buildQueryMock} from '../../testing/mocking';
import {
  ASSET_CATALOG_TABLE_QUERY,
  ASSET_CATALOG_TABLE_QUERY_VERSION,
  useAllAssets,
} from '../AssetsCatalogTable';
import {
  AssetCatalogTableQuery,
  AssetCatalogTableQueryVariables,
} from '../types/AssetsCatalogTable.types';

jest.mock('idb-lru-cache', () => {
  const mockedCache = {
    has: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    constructorArgs: {},
  };

  return {
    cache: (...args: any[]) => {
      mockedCache.constructorArgs = args;
      return mockedCache;
    },
  };
});

const createMock = ({
  nodes,
  cursor,
  limit = 2,
}: {
  limit?: number;
  cursor?: string;
  nodes: Asset[];
}) =>
  buildQueryMock<AssetCatalogTableQuery, AssetCatalogTableQueryVariables>({
    query: ASSET_CATALOG_TABLE_QUERY,
    variables: {
      limit,
      cursor,
    },
    data: {
      assetsOrError: buildAssetConnection({
        nodes,
      }),
    },
    delay: 100,
  });

describe('useAllAssets', () => {
  it('Paginates correctly', async () => {
    const mock = createMock({
      nodes: [buildAsset({id: 'asset-id-1'}), buildAsset({id: 'asset-id-2'})],
    });
    const mock2 = createMock({
      cursor: 'asset-id-2',
      nodes: [buildAsset({id: 'asset-id-3'}), buildAsset({id: 'asset-id-4'})],
    });
    const mock3 = createMock({
      cursor: 'asset-id-4',
      nodes: [buildAsset({id: 'asset-id-5'})],
    });

    const {result} = renderHook(() => useAllAssets({batchLimit: 2}), {
      wrapper(props) {
        return <MockedProvider mocks={[mock, mock2, mock3]}>{props.children}</MockedProvider>;
      },
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.assets?.length).toBe(5);
  });

  it('Loads from Indexeddb cache and also requests latest data', async () => {
    (mockedCache as any)().has.mockResolvedValue(true);
    (mockedCache as any)().get.mockResolvedValueOnce({
      value: {
        data: [buildAsset()],
        version: ASSET_CATALOG_TABLE_QUERY_VERSION,
      },
    });
    const mock = createMock({
      nodes: [buildAsset({id: 'asset-id-1'}), buildAsset({id: 'asset-id-2'})],
    });
    const mock2 = createMock({
      cursor: 'asset-id-2',
      nodes: [buildAsset({id: 'asset-id-3'}), buildAsset({id: 'asset-id-4'})],
    });
    const mock3 = createMock({
      cursor: 'asset-id-4',
      nodes: [buildAsset({id: 'asset-id-5'})],
    });

    const {result} = renderHook(() => useAllAssets({batchLimit: 2}), {
      wrapper(props) {
        return <MockedProvider mocks={[mock, mock2, mock3]}>{props.children}</MockedProvider>;
      },
    });

    await waitFor(() => {
      expect(result.current.assets?.length).toBe(1);
    });
    await waitFor(() => {
      expect(result.current.assets?.length).toBe(5);
    });
  });
});
