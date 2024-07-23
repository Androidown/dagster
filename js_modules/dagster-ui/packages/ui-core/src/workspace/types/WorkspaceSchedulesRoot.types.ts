// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type WorkspaceSchedulesQueryVariables = Types.Exact<{
  selector: Types.RepositorySelector;
}>;

export type WorkspaceSchedulesQuery = {
  __typename: 'Query';
  repositoryOrError:
    | {
        __typename: 'PythonError';
        message: string;
        stack: Array<string>;
        errorChain: Array<{
          __typename: 'ErrorChainLink';
          isExplicitLink: boolean;
          error: {__typename: 'PythonError'; message: string; stack: Array<string>};
        }>;
      }
    | {
        __typename: 'Repository';
        id: string;
        name: string;
        schedules: Array<{
          __typename: 'Schedule';
          id: string;
          name: string;
          description: string | null;
          scheduleState: {
            __typename: 'InstigationState';
            id: string;
            selectorId: string;
            status: Types.InstigationStatus;
            hasStartPermission: boolean;
            hasStopPermission: boolean;
          };
        }>;
      }
    | {__typename: 'RepositoryNotFoundError'};
};
