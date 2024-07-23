import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useMemo} from 'react';

import {TestProvider} from '../../testing/TestProvider';
import {
  buildReloadFnForLocation,
  useRepositoryLocationReload,
} from '../useRepositoryLocationReload';

describe('useRepositoryReloadLocation', () => {
  // jest.useFakeTimers();

  const LOCATION = 'bar';

  const defaultMocks = {
    WorkspaceLocationEntry: () => ({
      id: () => LOCATION,
      name: () => LOCATION,
      loadStatus: () => 'LOADED',
    }),
    ReloadRepositoryLocationMutationResult: () => ({
      __typename: 'WorkspaceLocationEntry',
    }),
    RepositoryLocation: () => ({
      id: () => LOCATION,
    }),
  };

  const Test = () => {
    const reloadFn = useMemo(() => buildReloadFnForLocation(LOCATION), []);
    const {reloading, error, tryReload} = useRepositoryLocationReload({
      scope: 'location',
      reloadFn,
    });
    return (
      <div>
        <div>{`Reloading: ${reloading}`}</div>
        <div>{`Has error: ${!!error}`}</div>
        <button
          onClick={() => {
            tryReload();
          }}
        >
          Try
        </button>
      </div>
    );
  };

  it('reloads successfully if there are no errors', async () => {
    render(
      <TestProvider apolloProps={{mocks: [defaultMocks]}}>
        <Test />
      </TestProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    const tryButton = screen.getByRole('button', {name: /try/i});
    await userEvent.click(tryButton);

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: true/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
    });
  });

  it('surfaces mutation errors', async () => {
    const mocks = {
      ReloadRepositoryLocationMutationResult: () => ({
        __typename: 'RepositoryLocationNotFound',
        message: () => 'lol not here',
      }),
    };

    render(
      <TestProvider apolloProps={{mocks: [defaultMocks, mocks]}}>
        <Test />
      </TestProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    const tryButton = screen.getByRole('button', {name: /try/i});
    await userEvent.click(tryButton);

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: true/)).toBeVisible();
    });
  });

  it('surfaces code location errors', async () => {
    const mocks = {
      RepositoryLocationOrLoadError: () => ({
        __typename: 'PythonError',
        message: () => 'u cannot do this',
      }),
    };

    render(
      <TestProvider apolloProps={{mocks: [defaultMocks, mocks]}}>
        <Test />
      </TestProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    await userEvent.click(screen.getByText(/Try/));

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: true/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: true/)).toBeVisible();
    });
  });

  it('waits for polling when attempting reload', async () => {
    const mocks = {
      WorkspaceLocationEntry: () => ({
        id: () => LOCATION,
        name: () => LOCATION,
        loadStatus: () => 'LOADING',
      }),
    };

    const {rerender} = render(
      <TestProvider apolloProps={{mocks: [defaultMocks, mocks]}}>
        <Test />
      </TestProvider>,
    );

    await userEvent.click(screen.getByText(/Try/));

    // Still considered reloading while polling occurs.
    await waitFor(() => {
      expect(screen.queryByText(/Reloading: true/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    // Still polling.
    await waitFor(() => {
      expect(screen.queryByText(/Reloading: true/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    // Set the location entry to `LOADED`, which should terminate polling.
    rerender(
      <TestProvider apolloProps={{mocks: defaultMocks}}>
        <Test />
      </TestProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });
  });

  it('stops polling when attempting reload when `LOADED` and there are errors', async () => {
    const mocks = {
      WorkspaceLocationEntry: () => ({
        id: () => LOCATION,
        name: () => LOCATION,
        loadStatus: () => 'LOADING',
      }),
    };

    const {rerender} = render(
      <TestProvider apolloProps={{mocks: [defaultMocks, mocks]}}>
        <Test />
      </TestProvider>,
    );

    await userEvent.click(screen.getByText(/Try/));

    // Still considered reloading while polling occurs.
    await waitFor(() => {
      expect(screen.queryByText(/Reloading: true/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    // Still polling.
    await waitFor(() => {
      expect(screen.queryByText(/Reloading: true/)).toBeVisible();
      expect(screen.queryByText(/Has error: false/)).toBeVisible();
    });

    const mocksWithError = {
      RepositoryLocationOrLoadError: () => ({
        __typename: 'PythonError',
        message: () => 'u cannot do this',
      }),
    };

    // Set an error on the code location and use the `LOADED` state from the
    // default mocks to end polling.
    rerender(
      <TestProvider apolloProps={{mocks: [defaultMocks, mocksWithError]}}>
        <Test />
      </TestProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Reloading: false/)).toBeVisible();
      expect(screen.queryByText(/Has error: true/)).toBeVisible();
    });
  });
});
