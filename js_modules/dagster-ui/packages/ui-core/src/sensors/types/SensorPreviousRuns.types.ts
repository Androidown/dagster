// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type PreviousRunsForSensorQueryVariables = Types.Exact<{
  filter?: Types.InputMaybe<Types.RunsFilter>;
  cursor?: Types.InputMaybe<Types.Scalars['String']['input']>;
  limit?: Types.InputMaybe<Types.Scalars['Int']['input']>;
}>;

export type PreviousRunsForSensorQuery = {
  __typename: 'Query';
  pipelineRunsOrError:
    | {__typename: 'InvalidPipelineRunsFilterError'}
    | {__typename: 'PythonError'}
    | {
        __typename: 'Runs';
        results: Array<{
          __typename: 'Run';
          id: string;
          status: Types.RunStatus;
          stepKeysToExecute: Array<string> | null;
          canTerminate: boolean;
          hasReExecutePermission: boolean;
          hasTerminatePermission: boolean;
          hasDeletePermission: boolean;
          mode: string;
          rootRunId: string | null;
          parentRunId: string | null;
          pipelineSnapshotId: string | null;
          pipelineName: string;
          solidSelection: Array<string> | null;
          creationTime: number;
          startTime: number | null;
          endTime: number | null;
          updateTime: number | null;
          repositoryOrigin: {
            __typename: 'RepositoryOrigin';
            id: string;
            repositoryName: string;
            repositoryLocationName: string;
          } | null;
          assetSelection: Array<{__typename: 'AssetKey'; path: Array<string>}> | null;
          assetCheckSelection: Array<{
            __typename: 'AssetCheckhandle';
            name: string;
            assetKey: {__typename: 'AssetKey'; path: Array<string>};
          }> | null;
          tags: Array<{__typename: 'PipelineTag'; key: string; value: string}>;
        }>;
      };
};
