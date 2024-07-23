import faker from 'faker';

import {RepositoryLocationLoadStatus} from '../graphql/types';

export const hyphenatedName = (wordCount = 2) =>
  faker.random.words(wordCount).replace(/ /g, '-').toLowerCase();
const randomId = () => faker.datatype.uuid();

/**
 * A set of default values to use for Jest GraphQL mocks.
 *
 * MyType: () => ({
 *   someField: () => 'some_value',
 * }),
 */
export const defaultMocks = {
  Asset: () => ({
    id: randomId,
  }),
  AssetNode: () => ({
    id: randomId,
    opName: hyphenatedName,
    metadataEntries: () => [],
  }),
  AssetGroup: () => ({
    groupName: hyphenatedName,
  }),
  ISolidDefinition: () => ({
    __typename: 'SolidDefinition',
  }),
  Mode: () => ({
    name: () => 'default',
  }),
  Pipeline: () => ({
    id: randomId,
    isJob: () => false,
    isAssetJob: () => false,
    name: hyphenatedName,
    pipelineSnapshotId: randomId,
    schedules: () => [],
    sensors: () => [],
    solids: () => [...new Array(2)],
    modes: () => [...new Array(1)],
  }),
  Query: () => ({
    version: () => 'x.y.z',
  }),
  Repository: () => ({
    id: randomId,
    name: hyphenatedName,
  }),
  RepositoryLocation: () => ({
    id: randomId,
    name: hyphenatedName,
  }),
  Workspace: () => ({
    id: 'workspace',
    locationEntries: () => [...new Array(1)],
  }),
  WorkspaceLocationEntry: () => ({
    id: randomId,
    loadStatus: () => RepositoryLocationLoadStatus.LOADED,
  }),
  WorkspaceLocationStatusEntries: () => ({
    entries: () => [...new Array(1)],
  }),
  WorkspaceLocationStatusEntry: () => ({
    id: randomId,
    loadStatus: () => RepositoryLocationLoadStatus.LOADED,
    updateTimestamp: () => 0,
  }),
  Schedule: () => ({
    id: hyphenatedName,
    name: hyphenatedName,
    results: () => [...new Array(1)],
  }),
  Sensor: () => ({
    id: hyphenatedName,
    name: hyphenatedName,
    results: () => [...new Array(1)],
  }),
  Solid: () => ({
    name: hyphenatedName,
  }),
  PythonError: () => ({
    message: () => 'A wild python error appeared!',
    stack: () => [],
  }),

  // Disambiguate error unions. If you'd like to mock an error, define a custom mock
  // for the type.
  RepositoriesOrError: () => ({
    __typename: 'RepositoryConnection',
  }),
  DagsterTypeOrError: () => ({
    __typename: 'RegularDagsterType',
  }),
  PipelineRunStatsOrError: () => ({
    __typename: 'PipelineRunStatsSnapshot',
  }),
  RunStatsSnapshotOrError: () => ({
    __typename: 'RunStatsSnapshot',
  }),
  PipelineRunOrError: () => ({
    __typename: 'PipelineRun',
  }),
  RunOrError: () => ({
    __typename: 'Run',
  }),
  PartitionsOrError: () => ({
    __typename: 'Partitions',
  }),
  PartitionRunConfigOrError: () => ({
    __typename: 'PartitionRunConfig',
  }),
  PartitionTagsOrError: () => ({
    __typename: 'PartitionTags',
  }),
  PartitionStatusesOrError: () => ({
    __typename: 'PartitionStatuses',
  }),
  RepositoryOrError: () => ({
    __typename: 'Repository',
  }),
  WorkspaceOrError: () => ({
    __typename: 'Workspace',
  }),
  RepositoryLocationOrLoadError: () => ({
    __typename: 'RepositoryLocation',
  }),
  PipelineOrError: () => ({
    __typename: 'Pipeline',
  }),
  PipelineSnapshotOrError: () => ({
    __typename: 'PipelineSnapshot',
  }),
  SchedulerOrError: () => ({
    __typename: 'Scheduler',
  }),
  ScheduleOrError: () => ({
    __typename: 'Schedule',
  }),
  SchedulesOrError: () => ({
    __typename: 'Schedules',
  }),
  SensorOrError: () => ({
    __typename: 'Sensor',
  }),
  SensorsOrError: () => ({
    __typename: 'Sensors',
  }),
  JobStateOrError: () => ({
    __typename: 'JobState',
  }),
  JobStatesOrError: () => ({
    __typename: 'JobStates',
  }),
  PartitionSetsOrError: () => ({
    __typename: 'PartitionSets',
  }),
  PartitionSetOrError: () => ({
    __typename: 'PartitionSet',
  }),
  PipelineRunsOrError: () => ({
    __typename: 'PipelineRuns',
  }),
  RunsOrError: () => ({
    __typename: 'Runs',
  }),
  RunGroupOrError: () => ({
    __typename: 'RunGroup',
  }),
  ExecutionPlanOrError: () => ({
    __typename: 'ExecutionPlan',
  }),
  RunConfigSchemaOrError: () => ({
    __typename: 'RunConfigSchema',
  }),
  AssetsOrError: () => ({
    __typename: 'AssetConnection',
  }),
  AssetOrError: () => ({
    __typename: 'Asset',
  }),
  AssetNodeOrError: () => ({
    __typename: 'AssetNode',
  }),
  PartitionBackfillOrError: () => ({
    __typename: 'PartitionBackfill',
  }),
  PartitionBackfillsOrError: () => ({
    __typename: 'PartitionBackfills',
  }),
  StopSensorMutationResultOrError: () => ({
    __typename: 'StopSensorMutationResult',
  }),
  ConfigTypeOrError: () => ({
    __typename: 'EnumConfigType',
  }),
  InstigationStatesOrError: () => ({
    __typename: 'InstigationStates',
  }),
  LocationStatusesOrError: () => ({
    __typename: 'WorkspaceLocationStatusEntries',
  }),
};
