import {Button, Icon, Menu, MenuItem, Popover} from '@dagster-io/ui-components';
import {useMemo, useState} from 'react';

import {ScheduleInfo, ScheduleStateChangeDialog} from './ScheduleStateChangeDialog';
import {instigationStateSummary} from '../instigation/instigationStateSummary';
import {OpenWithIntent} from '../instigation/useInstigationStateReducer';

interface Props {
  schedules: ScheduleInfo[];
  onDone: () => void;
}

export const ScheduleBulkActionMenu = (props: Props) => {
  const {schedules, onDone} = props;
  const count = schedules.length;

  const [openWithIntent, setOpenWithIntent] = useState<OpenWithIntent>('not-open');

  const {anyOff, anyOn} = useMemo(() => {
    return instigationStateSummary(schedules.map(({scheduleState}) => scheduleState));
  }, [schedules]);

  return (
    <>
      <Popover
        content={
          <Menu>
            <MenuItem
              text={`Start ${count === 1 ? '1 schedule' : `${count} schedules`}`}
              disabled={!anyOff}
              aria-disabled={!anyOff}
              icon="toggle_on"
              onClick={() => {
                setOpenWithIntent('start');
              }}
            />
            <MenuItem
              text={`Stop ${count === 1 ? '1 schedule' : `${count} schedules`}`}
              disabled={!anyOn}
              aria-disabled={!anyOn}
              icon="toggle_off"
              onClick={() => {
                setOpenWithIntent('stop');
              }}
            />
          </Menu>
        }
        placement="bottom-end"
      >
        <Button disabled={!count} intent="primary" rightIcon={<Icon name="expand_more" />}>
          Actions
        </Button>
      </Popover>
      <ScheduleStateChangeDialog
        openWithIntent={openWithIntent}
        schedules={schedules}
        onClose={() => setOpenWithIntent('not-open')}
        onComplete={() => {
          onDone();
        }}
      />
    </>
  );
};
