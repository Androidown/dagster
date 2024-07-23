import {Box, Spinner} from '@dagster-io/ui-components';
import {memo, useContext, useEffect} from 'react';

import {RawLogContent} from './RawLogContent';
import {useComputeLogs} from './useComputeLogs';
import {AppContext} from '../app/AppContext';

interface ComputeLogPanelProps {
  runId: string;
  ioType: string;
  setComputeLogUrl: (url: string | null) => void;
}

interface ComputeLogPanelMaybeKeyProps extends ComputeLogPanelProps {
  computeLogFileKey?: string;
}

export const ComputeLogPanel = (props: ComputeLogPanelMaybeKeyProps) => {
  const {runId, computeLogFileKey, ioType, setComputeLogUrl} = props;

  if (!computeLogFileKey) {
    return (
      <Box
        flex={{justifyContent: 'center', alignItems: 'center'}}
        style={{flex: 1, height: '100%'}}
      >
        <Spinner purpose="section" />
      </Box>
    );
  }

  return (
    <ComputeLogsPanelWithKey
      runId={runId}
      computeLogFileKey={computeLogFileKey}
      ioType={ioType}
      setComputeLogUrl={setComputeLogUrl}
    />
  );
};

interface ComputeLogPanelWithKeyProps extends ComputeLogPanelProps {
  computeLogFileKey: string;
}

const resolveDownloadUrl = (rootServerURI: string, downloadUrl: string | null) => {
  if (!downloadUrl) {
    return null;
  }
  const isRelativeUrl = (x?: string) => x && x.startsWith('/');
  return isRelativeUrl(downloadUrl) ? rootServerURI + downloadUrl : downloadUrl;
};

const ComputeLogsPanelWithKey = memo((props: ComputeLogPanelWithKeyProps) => {
  const {runId, computeLogFileKey, ioType, setComputeLogUrl} = props;
  const {rootServerURI} = useContext(AppContext);

  const {isLoading, stdout, stderr} = useComputeLogs(runId, computeLogFileKey);
  const stdoutDownloadUrl = resolveDownloadUrl(rootServerURI, stdout?.downloadUrl || null);
  const stderrDownloadUrl = resolveDownloadUrl(rootServerURI, stderr?.downloadUrl || null);

  return (
    <div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}>
      <ContentWrapper
        content={stdout ? stdout.data : null}
        path={stdout ? stdout.path : undefined}
        downloadUrl={stdoutDownloadUrl}
        isLoading={isLoading}
        isVisible={ioType === 'stdout'}
        setComputeLogUrl={setComputeLogUrl}
      />
      <ContentWrapper
        content={stderr ? stderr.data : null}
        path={stderr ? stderr.path : undefined}
        downloadUrl={stderrDownloadUrl}
        isLoading={isLoading}
        isVisible={ioType === 'stderr'}
        setComputeLogUrl={setComputeLogUrl}
      />
    </div>
  );
});

const ContentWrapper = ({
  isLoading,
  isVisible,
  content,
  path,
  downloadUrl,
  setComputeLogUrl,
}: {
  isVisible: boolean;
  isLoading: boolean;
  content: string | null;
  path?: string;
  downloadUrl: string | null;
  setComputeLogUrl: (url: string | null) => void;
}) => {
  useEffect(() => {
    setComputeLogUrl(downloadUrl);
  }, [setComputeLogUrl, downloadUrl]);
  return (
    <RawLogContent
      logData={content}
      isLoading={isLoading}
      isVisible={isVisible}
      downloadUrl={downloadUrl}
      location={path}
    />
  );
};
