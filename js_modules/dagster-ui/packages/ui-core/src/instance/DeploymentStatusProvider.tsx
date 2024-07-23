import * as React from 'react';

import {StatusAndMessage} from './DeploymentStatusType';
import {useDaemonStatus} from './useDaemonStatus';
import {useCodeLocationsStatus} from '../nav/useCodeLocationsStatus';

export type DeploymentStatusType = 'code-locations' | 'daemons';

export type DeploymentStatus = {
  codeLocations: StatusAndMessage | null;
  daemons: StatusAndMessage | null;
};

export const DeploymentStatusContext = React.createContext<DeploymentStatus>({
  codeLocations: null,
  daemons: null,
});

interface Props {
  children: React.ReactNode;
  include: Set<DeploymentStatusType>;
}

export const DeploymentStatusProvider = (props: Props) => {
  const {children, include} = props;

  const codeLocations = useCodeLocationsStatus();
  const daemons = useDaemonStatus(!include.has('daemons'));

  const value = React.useMemo(() => ({codeLocations, daemons}), [daemons, codeLocations]);

  return (
    <DeploymentStatusContext.Provider value={value}>{children}</DeploymentStatusContext.Provider>
  );
};
