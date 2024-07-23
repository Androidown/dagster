import {gql, useQuery} from '@apollo/client';

import {
  AssetGraphSidebarQuery,
  AssetGraphSidebarQueryVariables,
} from './types/AssetGraphJobSidebar.types';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {PipelineSelector} from '../graphql/types';
import {useBlockTraceOnQueryResult} from '../performance/TraceContext';
import {NonIdealPipelineQueryResult} from '../pipelines/NonIdealPipelineQueryResult';
import {
  SIDEBAR_ROOT_CONTAINER_FRAGMENT,
  SidebarContainerOverview,
} from '../pipelines/SidebarContainerOverview';
import {Loading} from '../ui/Loading';
import {buildRepoAddress} from '../workspace/buildRepoAddress';

interface Props {
  pipelineSelector: PipelineSelector;
}

export const AssetGraphJobSidebar = ({pipelineSelector}: Props) => {
  const queryResult = useQuery<AssetGraphSidebarQuery, AssetGraphSidebarQueryVariables>(
    ASSET_GRAPH_JOB_SIDEBAR,
    {
      variables: {pipelineSelector},
    },
  );
  useBlockTraceOnQueryResult(queryResult, 'AssetGraphSidebarQuery');

  const {repositoryName, repositoryLocationName} = pipelineSelector;
  const repoAddress = buildRepoAddress(repositoryName, repositoryLocationName);

  return (
    <Loading queryResult={queryResult}>
      {({pipelineSnapshotOrError}) => {
        if (pipelineSnapshotOrError.__typename !== 'PipelineSnapshot') {
          return (
            <NonIdealPipelineQueryResult
              isGraph
              result={pipelineSnapshotOrError}
              repoAddress={repoAddress}
            />
          );
        }
        return (
          <SidebarContainerOverview container={pipelineSnapshotOrError} repoAddress={repoAddress} />
        );
      }}
    </Loading>
  );
};

const ASSET_GRAPH_JOB_SIDEBAR = gql`
  query AssetGraphSidebarQuery($pipelineSelector: PipelineSelector!) {
    pipelineSnapshotOrError(activePipelineSelector: $pipelineSelector) {
      ... on PipelineSnapshot {
        id
        ...SidebarRootContainerFragment
      }
      ... on PipelineNotFoundError {
        message
      }
      ... on PipelineSnapshotNotFoundError {
        message
      }
      ...PythonErrorFragment
    }
  }

  ${SIDEBAR_ROOT_CONTAINER_FRAGMENT}
  ${PYTHON_ERROR_FRAGMENT}
`;
