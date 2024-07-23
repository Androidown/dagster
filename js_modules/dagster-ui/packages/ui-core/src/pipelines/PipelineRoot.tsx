import {useContext} from 'react';
import {Redirect, Switch} from 'react-router-dom';

import {JobFeatureContext} from './JobFeatureContext';
import {PipelineOrJobDisambiguationRoot} from './PipelineOrJobDisambiguationRoot';
import {PipelineRunsRoot} from './PipelineRunsRoot';
import {Route} from '../app/Route';
import {JobOrAssetLaunchpad} from '../launchpad/LaunchpadRoot';
import {LaunchpadSetupFromRunRoot} from '../launchpad/LaunchpadSetupFromRunRoot';
import {LaunchpadSetupRoot} from '../launchpad/LaunchpadSetupRoot';
import {PipelineNav} from '../nav/PipelineNav';
import {PipelinePartitionsRoot} from '../partitions/PipelinePartitionsRoot';
import {RepoAddress} from '../workspace/types';

interface Props {
  repoAddress: RepoAddress;
}

export const PipelineRoot = (props: Props) => {
  const {repoAddress} = props;
  const {FallthroughRoute} = useContext(JobFeatureContext);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <PipelineNav repoAddress={repoAddress} />
      <Switch>
        <Route path="/locations/:repoPath/pipeline_or_job/:pipelinePath(/?.*)">
          <PipelineOrJobDisambiguationRoot repoAddress={repoAddress} />
        </Route>
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/playground/setup',
            '/locations/:repoPath/jobs/:pipelinePath/playground/setup',
          ]}
        >
          <LaunchpadSetupRoot repoAddress={repoAddress} />
        </Route>
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/playground/setup-from-run/:runId',
            '/locations/:repoPath/jobs/:pipelinePath/playground/setup-from-run/:runId',
          ]}
        >
          <LaunchpadSetupFromRunRoot repoAddress={repoAddress} />
        </Route>
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/playground',
            '/locations/:repoPath/jobs/:pipelinePath/playground',
          ]}
        >
          <JobOrAssetLaunchpad repoAddress={repoAddress} />
        </Route>
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/runs/:runId',
            '/locations/:repoPath/jobs/:pipelinePath/runs/:runId',
          ]}
          render={(props) => <Redirect to={`/runs/${props.match.params.runId}`} />}
        />
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/runs',
            '/locations/:repoPath/jobs/:pipelinePath/runs',
          ]}
        >
          <PipelineRunsRoot repoAddress={repoAddress} />
        </Route>
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/partitions',
            '/locations/:repoPath/jobs/:pipelinePath/partitions',
          ]}
        >
          <PipelinePartitionsRoot repoAddress={repoAddress} />
        </Route>
        <Route
          path={[
            '/locations/:repoPath/pipelines/:pipelinePath/overview',
            '/locations/:repoPath/jobs/:pipelinePath/overview',
          ]}
          render={(props) => (
            <Redirect to={`/locations/${props.match.url.replace(/\/overview$/i, '')}`} />
          )}
        />
        <Route path={['/locations/:repoPath/pipelines/(/?.*)', '/locations/:repoPath/jobs/(/?.*)']}>
          <FallthroughRoute repoAddress={repoAddress} />
        </Route>
      </Switch>
    </div>
  );
};
