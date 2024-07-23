import {ApolloClient, ApolloError, gql, useApolloClient, useQuery} from '@apollo/client';
// eslint-disable-next-line no-restricted-imports
import {Intent} from '@blueprintjs/core';
import {useCallback, useMemo, useReducer} from 'react';

import {
  ReloadRepositoryLocationMutation,
  ReloadRepositoryLocationMutationVariables,
  ReloadWorkspaceMutation,
  ReloadWorkspaceMutationVariables,
  RepositoryLocationStatusQuery,
  RepositoryLocationStatusQueryVariables,
} from './types/useRepositoryLocationReload.types';
import {showSharedToaster} from '../app/DomUtils';
import {useInvalidateConfigsForRepo} from '../app/ExecutionSessionStorage';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {UNAUTHORIZED_ERROR_FRAGMENT} from '../app/PythonErrorInfo';
import {PythonErrorFragment} from '../app/types/PythonErrorFragment.types';
import {RepositoryLocationLoadStatus} from '../graphql/types';

type State = {
  mutating: boolean;
  pollStartTime: number | null;
  pollLocationIds: string[] | null;
  error: PythonErrorFragment | {message: string} | null;
  errorLocationId: string | null;
};

type Action =
  | {type: 'start-mutation'}
  | {type: 'finish-mutation-and-start-polling'; locationIds: string[]}
  | {type: 'finish-polling'}
  | {
      type: 'error';
      error: PythonErrorFragment | {message: string} | null;
      errorLocationId: string | null;
    }
  | {type: 'success'};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'start-mutation':
      return {...state, mutating: true, pollStartTime: null};
    case 'finish-mutation-and-start-polling':
      return {
        ...state,
        mutating: false,
        pollStartTime: Date.now(),
        pollLocationIds: action.locationIds,
      };
    case 'finish-polling':
      return {...state, pollStartTime: null};
    case 'error':
      return {
        ...state,
        mutating: false,
        error: action.error,
        errorLocationId: action.errorLocationId,
        pollStartTime: null,
      };
    case 'success':
      return {...state, error: null, pollStartTime: null};
    default:
      return state;
  }
};

const initialState: State = {
  mutating: false,
  pollStartTime: null,
  pollLocationIds: null,
  error: null,
  errorLocationId: null,
};

const THREE_MINUTES = 3 * 60 * 1000;

/**
 * This hook implements a two step flow: run a reload function that returns a list of locations,
 * and then poll those locations until their loadStatus is LOADED, reporting any errors that
 * occur.
 *
 * For convenience, there are two pre-built reload functions below, one for reloading the workspace
 * (and waiting for all locations to come back online), and one for reloading a single location.
 */
export const useRepositoryLocationReload = ({
  scope,
  reloadFn,
}: {
  scope: 'location' | 'workspace';
  reloadFn: (client: ApolloClient<any>) => Promise<Action>;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const apollo = useApolloClient();

  const invalidateConfigs = useInvalidateConfigsForRepo();

  const {startPolling, stopPolling} = useQuery<
    RepositoryLocationStatusQuery,
    RepositoryLocationStatusQueryVariables
  >(REPOSITORY_LOCATION_STATUS_QUERY, {
    skip: state.pollStartTime === null,
    pollInterval: 5000,
    fetchPolicy: 'no-cache',
    // This is irritating, but apparently necessary for now.
    // https://github.com/apollographql/apollo-client/issues/5531
    notifyOnNetworkStatusChange: true,
    onCompleted: (data: RepositoryLocationStatusQuery) => {
      // SetTimeout to avoid infinite loop in test
      setTimeout(async () => {
        const workspace = data.workspaceOrError;

        if (workspace.__typename === 'PythonError') {
          dispatch({type: 'error', error: workspace, errorLocationId: null});
          stopPolling();
          return;
        }
        if (state.pollLocationIds === null) {
          stopPolling();
          return;
        }

        type LocationEntryType = (typeof workspace.locationEntries)[number];
        const locationMap = Object.fromEntries(workspace.locationEntries.map((e) => [e.id, e]));
        const matches = state.pollLocationIds
          .map((id) => locationMap[id])
          .filter((location): location is LocationEntryType => !!location);
        const missingId = state.pollLocationIds.find((id) => !locationMap[id]);

        if (missingId) {
          dispatch({
            type: 'error',
            error: {message: `Location ${missingId} not found in workspace.`},
            errorLocationId: missingId,
          });
          stopPolling();
          return;
        }

        // If we're still loading, there's nothing to do yet. Continue polling unless
        // we have hit our timeout threshold.
        if (matches.some((l) => l.loadStatus === RepositoryLocationLoadStatus.LOADING)) {
          if (Date.now() - Number(state.pollStartTime) > THREE_MINUTES) {
            const message = `Timed out waiting for the ${
              matches.length > 1 ? 'locations' : 'location'
            } to reload.`;
            dispatch({
              type: 'error',
              error: {message},
              errorLocationId: null,
            });
            stopPolling();
          }
          return;
        }

        // If we're done loading and an error persists, show it.
        const errorLocation = matches.find(
          (m) => m.locationOrLoadError?.__typename === 'PythonError',
        );

        if (errorLocation && errorLocation.locationOrLoadError?.__typename === 'PythonError') {
          dispatch({
            type: 'error',
            error: errorLocation.locationOrLoadError,
            errorLocationId: errorLocation.id,
          });
          stopPolling();
          return;
        }

        // Otherwise, we have no errors left.
        dispatch({type: 'finish-polling'});
        stopPolling();

        // On success, show the successful toast, hide the dialog (if open), and reset Apollo.
        await showSharedToaster({
          message: `${scope === 'location' ? 'Code location' : 'Definitions'} reloaded!`,
          timeout: 3000,
          icon: 'check_circle',
          intent: Intent.SUCCESS,
        });
        dispatch({type: 'success'});

        // Update run config localStorage, which may now be out of date.
        const repositories = matches.flatMap((location) =>
          location?.__typename === 'WorkspaceLocationEntry' &&
          location.locationOrLoadError?.__typename === 'RepositoryLocation'
            ? location.locationOrLoadError.repositories.map((repo) => ({
                ...repo,
                locationName: location.id,
              }))
            : [],
        );

        invalidateConfigs(repositories);

        // Refetch all the queries bound to the UI.
        apollo.refetchQueries({include: 'active'});
      }, 0);
    },
  });

  const tryReload = useCallback(async () => {
    dispatch({type: 'start-mutation'});
    const action = await reloadFn(apollo);
    dispatch(action);
    if (action.type === 'finish-mutation-and-start-polling') {
      startPolling(THREE_MINUTES);
    }
  }, [apollo, reloadFn, startPolling]);

  const {mutating, pollStartTime, error, errorLocationId} = state;
  const reloading = mutating || pollStartTime !== null;

  return useMemo(
    () => ({reloading, error, errorLocationId, tryReload, mutating}),
    [reloading, error, errorLocationId, tryReload, mutating],
  );
};

const REPOSITORY_LOCATION_STATUS_QUERY = gql`
  query RepositoryLocationStatusQuery {
    workspaceOrError {
      ... on Workspace {
        id
        locationEntries {
          id
          loadStatus
          locationOrLoadError {
            ... on RepositoryLocation {
              id
              repositories {
                id
                name
                pipelines {
                  id
                  name
                }
              }
            }
            ...PythonErrorFragment
          }
        }
      }
      ...PythonErrorFragment
    }
  }

  ${PYTHON_ERROR_FRAGMENT}
`;

// Reload Function - Workspace

export const reloadFnForWorkspace = async (client: ApolloClient<any>): Promise<Action> => {
  const {data} = await client.mutate<ReloadWorkspaceMutation, ReloadWorkspaceMutationVariables>({
    mutation: RELOAD_WORKSPACE_MUTATION,
  });
  if (!data) {
    return {type: 'error', error: {message: 'Unable to reload definitions'}, errorLocationId: null};
  }
  if (
    data.reloadWorkspace.__typename === 'PythonError' ||
    data.reloadWorkspace.__typename === 'UnauthorizedError'
  ) {
    return {type: 'error', error: data?.reloadWorkspace, errorLocationId: null};
  }
  return {
    type: 'finish-mutation-and-start-polling',
    locationIds: data.reloadWorkspace.locationEntries.map((l) => l.id),
  };
};

const RELOAD_WORKSPACE_MUTATION = gql`
  mutation ReloadWorkspaceMutation {
    reloadWorkspace {
      ... on Workspace {
        id
        locationEntries {
          name
          id
          loadStatus
          locationOrLoadError {
            ... on RepositoryLocation {
              id
              repositories {
                id
                name
                pipelines {
                  id
                  name
                }
              }
            }
            ...PythonErrorFragment
          }
        }
      }
      ...UnauthorizedErrorFragment
      ...PythonErrorFragment
    }
  }

  ${UNAUTHORIZED_ERROR_FRAGMENT}
  ${PYTHON_ERROR_FRAGMENT}
`;

// Reload Function - Single Location

export const buildReloadFnForLocation = (location: string) => {
  return async (client: ApolloClient<any>): Promise<Action> => {
    let data;
    try {
      const result = await client.mutate<
        ReloadRepositoryLocationMutation,
        ReloadRepositoryLocationMutationVariables
      >({
        mutation: RELOAD_REPOSITORY_LOCATION_MUTATION,
        variables: {location},
      });
      data = result.data;
    } catch (e) {
      // The `mutate` Promise has rejected due to an error, probably an http error.
      return {
        type: 'error',
        error: {message: e instanceof ApolloError ? e.message : 'An unexpected error occurred'},
        errorLocationId: location,
      };
    }

    if (data?.reloadRepositoryLocation.__typename === 'WorkspaceLocationEntry') {
      // If the mutation occurs successfully, begin polling.
      return {type: 'finish-mutation-and-start-polling', locationIds: [location]};
    } else if (data?.reloadRepositoryLocation.__typename === 'PythonError') {
      // If a Python error occurs during mutation, show it.
      return {type: 'error', error: data.reloadRepositoryLocation, errorLocationId: location};
    } else {
      // Otherwise, we have some other kind of error. Show it.
      return {
        type: 'error',
        error: {message: data?.reloadRepositoryLocation.message || 'An unexpected error occurred.'},
        errorLocationId: location,
      };
    }
  };
};

const RELOAD_REPOSITORY_LOCATION_MUTATION = gql`
  mutation ReloadRepositoryLocationMutation($location: String!) {
    reloadRepositoryLocation(repositoryLocationName: $location) {
      ... on WorkspaceLocationEntry {
        id
        loadStatus
        locationOrLoadError {
          ... on RepositoryLocation {
            id
          }
          ...PythonErrorFragment
        }
      }
      ... on UnauthorizedError {
        message
      }
      ... on ReloadNotSupported {
        message
      }
      ... on RepositoryLocationNotFound {
        message
      }
      ...PythonErrorFragment
    }
  }

  ${PYTHON_ERROR_FRAGMENT}
`;
