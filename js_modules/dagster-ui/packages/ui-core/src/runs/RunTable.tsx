import {gql} from '@apollo/client';
import {Box, Checkbox, Table} from '@dagster-io/ui-components';
import * as React from 'react';

import {RunBulkActionsMenu} from './RunActionsMenu';
import {RunRow} from './RunRow';
import {RunTableActionBar} from './RunTableActionBar';
import {RunTableEmptyState} from './RunTableEmptyState';
import {RunTableTargetHeader} from './RunTableTargetHeader';
import {RUN_TIME_FRAGMENT} from './RunUtils';
import {RunFilterToken} from './RunsFilterInput';
import {RunTableRunFragment} from './types/RunTable.types';
import {RunsFilter} from '../graphql/types';
import {useSelectionReducer} from '../hooks/useSelectionReducer';

interface RunTableProps {
  runs: RunTableRunFragment[];
  filter?: RunsFilter;
  onAddTag?: (token: RunFilterToken) => void;
  actionBarSticky?: boolean;
  actionBarComponents?: React.ReactNode;
  highlightedIds?: string[];
  additionalColumnHeaders?: React.ReactNode[];
  additionalColumnsForRow?: (run: RunTableRunFragment) => React.ReactNode[];
  belowActionBarComponents?: React.ReactNode;
  hideCreatedBy?: boolean;
  additionalActionsForRun?: (run: RunTableRunFragment) => JSX.Element[];
  emptyState?: () => React.ReactNode;
}

export const RunTable = (props: RunTableProps) => {
  const {
    runs,
    filter,
    onAddTag,
    highlightedIds,
    actionBarSticky,
    actionBarComponents,
    belowActionBarComponents,
    hideCreatedBy,
    emptyState,
  } = props;
  const allIds = runs.map((r) => r.id);

  const [{checkedIds}, {onToggleFactory, onToggleAll}] = useSelectionReducer(allIds);

  const canTerminateOrDeleteAny = React.useMemo(() => {
    return runs.some((run) => run.hasTerminatePermission || run.hasDeletePermission);
  }, [runs]);

  function content() {
    if (runs.length === 0) {
      const anyFilter = !!Object.keys(filter || {}).length;
      if (emptyState) {
        return <>{emptyState()}</>;
      }

      return <RunTableEmptyState anyFilter={anyFilter} />;
    } else {
      return (
        <Table>
          <thead>
            <tr>
              {canTerminateOrDeleteAny ? (
                <th style={{width: 42, paddingTop: 0, paddingBottom: 0}}>
                  <Checkbox
                    indeterminate={checkedIds.size > 0 && checkedIds.size !== runs.length}
                    checked={checkedIds.size === runs.length}
                    onChange={(e: React.FormEvent<HTMLInputElement>) => {
                      if (e.target instanceof HTMLInputElement) {
                        onToggleAll(e.target.checked);
                      }
                    }}
                  />
                </th>
              ) : null}
              <th style={{width: 90}}>Run ID</th>
              <th style={{width: 180}}>Created date</th>
              <th>
                <RunTableTargetHeader />
              </th>
              {hideCreatedBy ? null : <th style={{width: 160}}>Launched by</th>}
              <th style={{width: 120}}>Status</th>
              <th style={{width: 190}}>Duration</th>
              {props.additionalColumnHeaders}
              <th style={{width: 52}} />
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <RunRow
                hasCheckboxColumn={canTerminateOrDeleteAny}
                canTerminateOrDelete={run.hasTerminatePermission || run.hasDeletePermission}
                run={run}
                key={run.id}
                onAddTag={onAddTag}
                checked={checkedIds.has(run.id)}
                additionalColumns={props.additionalColumnsForRow?.(run)}
                additionalActionsForRun={props.additionalActionsForRun}
                onToggleChecked={onToggleFactory(run.id)}
                isHighlighted={highlightedIds && highlightedIds.includes(run.id)}
                hideCreatedBy={hideCreatedBy}
              />
            ))}
          </tbody>
        </Table>
      );
    }
  }

  const selectedFragments = runs.filter((run) => checkedIds.has(run.id));

  return (
    <>
      <RunTableActionBar
        sticky={actionBarSticky}
        top={
          <Box
            flex={{
              direction: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              grow: 1,
            }}
          >
            {actionBarComponents}
            <RunBulkActionsMenu
              selected={selectedFragments}
              clearSelection={() => onToggleAll(false)}
            />
          </Box>
        }
        bottom={belowActionBarComponents}
      />
      {content()}
    </>
  );
};

export const RUN_TAGS_FRAGMENT = gql`
  fragment RunTagsFragment on PipelineTag {
    key
    value
  }
`;

export const RUN_TABLE_RUN_FRAGMENT = gql`
  fragment RunTableRunFragment on Run {
    id
    status
    stepKeysToExecute
    canTerminate
    hasReExecutePermission
    hasTerminatePermission
    hasDeletePermission
    mode
    rootRunId
    parentRunId
    pipelineSnapshotId
    pipelineName
    repositoryOrigin {
      id
      repositoryName
      repositoryLocationName
    }
    solidSelection
    assetSelection {
      ... on AssetKey {
        path
      }
    }
    assetCheckSelection {
      name
      assetKey {
        path
      }
    }
    status
    tags {
      ...RunTagsFragment
    }
    ...RunTimeFragment
  }

  ${RUN_TIME_FRAGMENT}
  ${RUN_TAGS_FRAGMENT}
`;
