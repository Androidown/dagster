import {Box, Button, Colors, Heading, Icon, PageHeader, Tooltip} from '@dagster-io/ui-components';
import {Link} from 'react-router-dom';

import {WorkspaceTabs} from './WorkspaceTabs';
import {repoAddressAsHumanString} from './repoAddressAsString';
import {RepoAddress} from './types';
import {QueryRefreshState} from '../app/QueryRefresh';
import {
  NO_RELOAD_PERMISSION_TEXT,
  ReloadRepositoryLocationButton,
} from '../nav/ReloadRepositoryLocationButton';

interface Props {
  repoAddress: RepoAddress;
  tab: string;
  refreshState?: QueryRefreshState;
}

export const WorkspaceHeader = (props: Props) => {
  const {repoAddress, tab, refreshState} = props;

  return (
    <PageHeader
      title={
        <Box flex={{direction: 'row', gap: 8, alignItems: 'center'}}>
          <Heading>
            <Link to="/locations" style={{color: Colors.textDefault()}}>
              Deployment
            </Link>
          </Heading>
          <Heading>/</Heading>
          <Heading style={{color: Colors.textLight()}}>
            {repoAddressAsHumanString(repoAddress)}
          </Heading>
        </Box>
      }
      tabs={<WorkspaceTabs repoAddress={repoAddress} tab={tab} refreshState={refreshState} />}
      right={
        <ReloadRepositoryLocationButton
          location={repoAddress.location}
          ChildComponent={({tryReload, reloading, hasReloadPermission}) => {
            return (
              <Tooltip
                canShow={!hasReloadPermission}
                content={hasReloadPermission ? '' : NO_RELOAD_PERMISSION_TEXT}
                useDisabledButtonTooltipFix
              >
                <Button
                  onClick={() => tryReload()}
                  loading={reloading}
                  disabled={!hasReloadPermission}
                  icon={<Icon name="refresh" />}
                  outlined
                >
                  Reload definitions
                </Button>
              </Tooltip>
            );
          }}
        />
      }
    />
  );
};
