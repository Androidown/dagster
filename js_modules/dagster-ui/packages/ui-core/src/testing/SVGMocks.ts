import path from 'path';

import {CachedGraphQLRequest} from './MockedApolloLinks';
import {PIPELINE_EXPLORER_ROOT_QUERY} from '../pipelines/PipelineExplorerRoot';
import {PipelineExplorerRootQueryVariables} from '../pipelines/types/PipelineExplorerRoot.types';

const dataDir = path.join(__dirname, '..', 'graph', '__data__');

// Top level rendering of these pipelines
export const MOCKS: CachedGraphQLRequest[] = [
  'airline_demo_ingest_pipeline',
  'airline_demo_warehouse_pipeline',
].map((name) => ({
  name,
  query: PIPELINE_EXPLORER_ROOT_QUERY,
  variables: {
    pipelineSelector: {
      pipelineName: name,
      repositoryLocationName: '<<in_process>>',
      repositoryName: 'internal_dagster_ui_repository',
    },
    rootHandleID: '',
    requestScopeHandleID: '',
  } as PipelineExplorerRootQueryVariables,
  filepath: path.join(dataDir, `${name}.json`),
}));

// Composite rendering
MOCKS.push({
  name: 'airline_demo_ingest_pipeline_composite',
  query: PIPELINE_EXPLORER_ROOT_QUERY,
  variables: {
    pipelineSelector: {
      pipelineName: 'airline_demo_ingest_pipeline',
      repositoryLocationName: '<<in_process>>',
      repositoryName: 'internal_dagster_ui_repository',
    },
    rootHandleID: 'master_cord_s3_to_df',
    requestScopeHandleID: 'master_cord_s3_to_df',
  } as PipelineExplorerRootQueryVariables,
  filepath: path.join(dataDir, `airline_demo_ingest_pipeline_composite.json`),
});

MOCKS.push(
  ...['composition', 'log_spew', 'many_events'].map((name) => ({
    name,
    query: PIPELINE_EXPLORER_ROOT_QUERY,
    variables: {
      pipelineSelector: {
        pipelineName: name,
        repositoryLocationName: 'toys_repository',
        repositoryName: 'toys_repository',
      },
      rootHandleID: '',
      requestScopeHandleID: '',
    } as PipelineExplorerRootQueryVariables,
    filepath: path.join(dataDir, `${name}.json`),
    repo: 'python_modules/dagster-test/dagster_test/toys',
    workspace: true,
  })),
);
