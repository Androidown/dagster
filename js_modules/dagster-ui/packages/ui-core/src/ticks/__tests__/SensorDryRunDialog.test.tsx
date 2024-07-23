import {Resolvers} from '@apollo/client';
import {MockedProvider, MockedResponse} from '@apollo/client/testing';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {SensorDryRunDialog} from '../SensorDryRunDialog';
import * as Mocks from '../__fixtures__/SensorDryRunDialog.fixtures';

// This component is unit tested separately so mocking it out
jest.mock('../DryRunRequestTable', () => {
  return {
    RunRequestTable: () => <div />,
  };
});

const onCloseMock = jest.fn();

function Test({mocks, resolvers}: {mocks?: MockedResponse[]; resolvers?: Resolvers}) {
  return (
    <MockedProvider mocks={mocks} resolvers={resolvers}>
      <SensorDryRunDialog
        name="test"
        onClose={onCloseMock}
        isOpen={true}
        repoAddress={{
          name: 'testName',
          location: 'testLocation',
        }}
        jobName="testJobName"
        currentCursor="testCursor"
      />
    </MockedProvider>
  );
}

describe('SensorDryRunTest', () => {
  it('submits sensorDryRun mutation with cursor variable and renders successful result and persists cursor', async () => {
    render(<Test mocks={[Mocks.SensorDryRunMutationRunRequests, Mocks.PersistCursorValueMock]} />);
    const cursorInput = await screen.findByTestId('cursor-input');
    await userEvent.type(cursorInput, 'testing123');
    await userEvent.click(screen.getByTestId('evaluate'));
    await waitFor(() => {
      expect(screen.getByText(/3\srun requests/g)).toBeVisible();
      expect(screen.queryByText('Skipped')).toBe(null);
      expect(screen.queryByText('Failed')).toBe(null);
    });
    await userEvent.click(screen.getByTestId('persist-cursor'));
    expect(screen.getByText('Persisting')).toBeVisible();
    await waitFor(() => {
      expect(screen.getByText('Persisted')).toBeVisible();
    });
  });

  it('renders errors', async () => {
    render(<Test mocks={[Mocks.SensorDryRunMutationError]} />);
    const cursorInput = await screen.findByTestId('cursor-input');
    await userEvent.type(cursorInput, 'testing123');
    await userEvent.click(screen.getByTestId('evaluate'));
    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeVisible();
      expect(screen.queryByText('Skipped')).toBe(null);
    });
  });

  it('allows you to test again', async () => {
    render(<Test mocks={[Mocks.SensorDryRunMutationError]} />);
    const cursorInput = await screen.findByTestId('cursor-input');
    await userEvent.type(cursorInput, 'testing123');
    await userEvent.click(screen.getByTestId('evaluate'));
    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeVisible();
      expect(screen.queryByText('Skipped')).toBe(null);
    });
    await userEvent.click(screen.getByTestId('test-again'));
    expect(screen.queryByText('Failed')).toBe(null);
    expect(screen.queryByText('Skipped')).toBe(null);
    expect(screen.getByTestId('cursor-input')).toBeVisible();
  });

  it('renders skip reason', async () => {
    render(<Test mocks={[Mocks.SensorDryRunMutationSkipped]} />);
    const cursorInput = await screen.findByTestId('cursor-input');
    await userEvent.type(cursorInput, 'testing123');
    await userEvent.click(screen.getByTestId('evaluate'));
    await waitFor(() => {
      expect(screen.getByText('Skipped')).toBeVisible();
    });
  });
});
