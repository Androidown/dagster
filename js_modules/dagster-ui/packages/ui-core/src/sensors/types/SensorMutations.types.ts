// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type StartSensorMutationVariables = Types.Exact<{
  sensorSelector: Types.SensorSelector;
}>;

export type StartSensorMutation = {
  __typename: 'Mutation';
  startSensor:
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
        __typename: 'Sensor';
        id: string;
        sensorState: {__typename: 'InstigationState'; id: string; status: Types.InstigationStatus};
      }
    | {__typename: 'SensorNotFoundError'; message: string}
    | {__typename: 'UnauthorizedError'; message: string};
};

export type StopRunningSensorMutationVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
}>;

export type StopRunningSensorMutation = {
  __typename: 'Mutation';
  stopSensor:
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
        __typename: 'StopSensorMutationResult';
        instigationState: {
          __typename: 'InstigationState';
          id: string;
          status: Types.InstigationStatus;
        } | null;
      }
    | {__typename: 'UnauthorizedError'; message: string};
};

export type ResetSensorMutationVariables = Types.Exact<{
  sensorSelector: Types.SensorSelector;
}>;

export type ResetSensorMutation = {
  __typename: 'Mutation';
  resetSensor:
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
        __typename: 'Sensor';
        id: string;
        sensorState: {__typename: 'InstigationState'; id: string; status: Types.InstigationStatus};
      }
    | {__typename: 'SensorNotFoundError'; message: string}
    | {__typename: 'UnauthorizedError'; message: string};
};
