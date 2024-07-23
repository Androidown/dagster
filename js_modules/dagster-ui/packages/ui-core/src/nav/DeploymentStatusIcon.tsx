import {Box, Colors, Icon, Spinner, Tooltip} from '@dagster-io/ui-components';
import {memo, useContext} from 'react';

import {WarningTooltip} from './WarningTooltip';
import {DeploymentStatusContext} from '../instance/DeploymentStatusProvider';

export const DeploymentStatusIcon = memo(() => {
  return <CombinedStatusIcon />;
});

const CombinedStatusIcon = memo(() => {
  const {codeLocations, daemons} = useContext(DeploymentStatusContext);

  if (codeLocations?.type === 'spinner') {
    return (
      <Tooltip content={codeLocations.content} placement="bottom">
        <Spinner purpose="body-text" fillColor={Colors.accentGray()} />
      </Tooltip>
    );
  }

  const anyWarning = daemons?.type === 'warning' || codeLocations?.type === 'warning';

  if (anyWarning) {
    return (
      <WarningTooltip
        content={
          <Box flex={{direction: 'column', gap: 4}}>
            {daemons?.content}
            {codeLocations?.content}
          </Box>
        }
        position="bottom"
        modifiers={{offset: {enabled: true, options: {offset: [0, 28]}}}}
      >
        <Icon name="warning" color={Colors.accentYellow()} />
      </WarningTooltip>
    );
  }

  return <div style={{display: 'none'}}>No errors</div>;
});
