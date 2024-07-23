import {gql, useQuery} from '@apollo/client';

import {AssetKeyTagCollection} from './AssetTagCollections';
import {RunAssetsQuery, RunAssetsQueryVariables} from './types/RunAssetTags.types';
import {RunFragment} from './types/RunFragments.types';
import {isHiddenAssetGroupJob} from '../asset-graph/Utils';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';

export const RunAssetTags = (props: {run: RunFragment}) => {
  const {run} = props;
  const skip = isHiddenAssetGroupJob(run.pipelineName);
  const queryResult = useQuery<RunAssetsQuery, RunAssetsQueryVariables>(RUN_ASSETS_QUERY, {
    variables: {runId: run.id},
    skip,
    fetchPolicy: 'no-cache',
  });
  const {data, loading} = queryResult;
  useBlockTraceOnQueryResult(queryResult, 'RunAssetsQuery', {skip});

  if (loading || !data || data.pipelineRunOrError.__typename !== 'Run') {
    return null;
  }

  return (
    <AssetKeyTagCollection useTags assetKeys={data.pipelineRunOrError.assets.map((a) => a.key)} />
  );
};

const RUN_ASSETS_QUERY = gql`
  query RunAssetsQuery($runId: ID!) {
    pipelineRunOrError(runId: $runId) {
      ... on Run {
        id
        assets {
          id
          key {
            path
          }
        }
      }
    }
  }
`;
