import {Box, CaptionMono, Colors, Popover, Tag} from '@dagster-io/ui-components';

import {RunStats} from './RunStats';
import {RunStatusIndicator} from './RunStatusDots';
import {assertUnreachable} from '../app/Util';
import {RunStatus} from '../graphql/types';

const statusToIntent = (status: RunStatus) => {
  switch (status) {
    case RunStatus.QUEUED:
    case RunStatus.NOT_STARTED:
    case RunStatus.CANCELED:
    case RunStatus.MANAGED:
      return 'none';
    case RunStatus.SUCCESS:
      return 'success';
    case RunStatus.FAILURE:
      return 'danger';
    case RunStatus.STARTING:
    case RunStatus.STARTED:
    case RunStatus.CANCELING:
      return 'primary';
    default:
      return assertUnreachable(status);
  }
};

const runStatusToString = (status: RunStatus) => {
  switch (status) {
    case RunStatus.QUEUED:
      return 'Queued';
    case RunStatus.SUCCESS:
      return 'Success';
    case RunStatus.STARTING:
      return 'Starting';
    case RunStatus.NOT_STARTED:
      return 'Not started';
    case RunStatus.FAILURE:
      return 'Failure';
    case RunStatus.STARTED:
      return 'Started';
    case RunStatus.MANAGED:
      return 'Managed';
    case RunStatus.CANCELING:
      return 'Canceling';
    case RunStatus.CANCELED:
      return 'Canceled';
    default:
      return assertUnreachable(status);
  }
};

export const runStatusToBackfillStateString = (status: RunStatus) => {
  switch (status) {
    case RunStatus.CANCELED:
      return 'Canceled';
    case RunStatus.CANCELING:
      return 'Canceling';
    case RunStatus.FAILURE:
      return 'Failed';
    case RunStatus.STARTING:
    case RunStatus.STARTED:
      return 'In progress';
    case RunStatus.QUEUED:
      return 'Queued';
    case RunStatus.SUCCESS:
      return 'Completed';
    case RunStatus.MANAGED:
    case RunStatus.NOT_STARTED:
      return 'Missing';
    default:
      return assertUnreachable(status);
  }
};

export const RUN_STATUS_COLORS = {
  QUEUED: Colors.accentGray(),
  NOT_STARTED: Colors.accentGrayHover(),
  MANAGED: Colors.accentGray(),
  STARTED: Colors.accentBlue(),
  STARTING: Colors.accentBlue(),
  CANCELING: Colors.accentBlue(),
  SUCCESS: Colors.accentGreen(),
  FAILURE: Colors.accentRed(),
  CANCELED: Colors.accentRed(),

  // Not technically a RunStatus, but useful.
  SCHEDULED: Colors.accentGray(),
};

export const RunStatusTag = (props: {status: RunStatus}) => {
  const {status} = props;
  return (
    <Tag intent={statusToIntent(status)}>
      <Box flex={{direction: 'row', alignItems: 'center', gap: 4}}>
        <RunStatusIndicator status={status} size={10} />
        <div>{runStatusToString(status)}</div>
      </Box>
    </Tag>
  );
};

export const RunStatusTagWithID = ({runId, status}: {runId: string; status: RunStatus}) => {
  return (
    <Tag intent={statusToIntent(status)}>
      <Box flex={{direction: 'row', alignItems: 'center', gap: 4}}>
        <RunStatusIndicator status={status} size={10} />
        <CaptionMono>{runId.slice(0, 8)}</CaptionMono>
      </Box>
    </Tag>
  );
};

interface Props {
  runId: string;
  status: RunStatus;
}

export const RunStatusTagWithStats = (props: Props) => {
  const {runId, status} = props;
  return (
    <Popover
      position="bottom-left"
      interactionKind="hover"
      content={<RunStats runId={runId} />}
      hoverOpenDelay={100}
      usePortal
    >
      <RunStatusTag status={status} />
    </Popover>
  );
};
