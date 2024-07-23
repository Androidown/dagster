import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {repoAddressFromPath} from '../../workspace/repoAddressFromPath';
import {buildStorageKey, useRepoExpansionState} from '../useRepoExpansionState';

const COLLAPSED_STORAGE_KEY = 'collapsed-key';
const ALL_REPO_KEYS = ['ipsum:lorem', 'amet:dolorsit', 'adipiscing:consectetur'];

describe('useRepoExpansionState', () => {
  const Test = () => {
    const {expandedKeys, onToggle, onToggleAll} = useRepoExpansionState(
      COLLAPSED_STORAGE_KEY,
      ALL_REPO_KEYS,
    );

    return (
      <div>
        {ALL_REPO_KEYS.map((key) => (
          <div key={key}>
            <div>{`${key} ${expandedKeys.includes(key) ? 'expanded' : 'collapsed'}`}</div>
            <button
              onClick={() => {
                const repoAddress = repoAddressFromPath(key);
                if (repoAddress) {
                  onToggle(repoAddress);
                }
              }}
            >
              {`toggle ${key}`}
            </button>
          </div>
        ))}
        <button onClick={() => onToggleAll(true)}>expand all</button>
        <button onClick={() => onToggleAll(false)}>collapse all</button>
      </div>
    );
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('provides a list of expanded keys for the stored state', async () => {
    window.localStorage.setItem(buildStorageKey('', COLLAPSED_STORAGE_KEY), JSON.stringify([]));
    render(<Test />);

    // Expect all keys to be expanded
    await waitFor(() => {
      expect(screen.getByText('ipsum:lorem expanded')).toBeVisible();
      expect(screen.getByText('amet:dolorsit expanded')).toBeVisible();
      expect(screen.getByText('adipiscing:consectetur expanded')).toBeVisible();
    });
  });

  it('tracks collapsed keys', async () => {
    window.localStorage.setItem(
      buildStorageKey('', COLLAPSED_STORAGE_KEY),
      JSON.stringify(['ipsum:lorem']),
    );
    render(<Test />);

    // Expect keys to have appropriate state. One collapsed!
    await waitFor(() => {
      expect(screen.getByText('ipsum:lorem collapsed')).toBeVisible();
      expect(screen.getByText('amet:dolorsit expanded')).toBeVisible();
      expect(screen.getByText('adipiscing:consectetur expanded')).toBeVisible();
    });
  });

  it('toggles a key to expanded', async () => {
    const fullCollapsedKey = buildStorageKey('', COLLAPSED_STORAGE_KEY);
    window.localStorage.setItem(fullCollapsedKey, JSON.stringify(['ipsum:lorem']));
    render(<Test />);

    const button = await screen.findByRole('button', {name: 'toggle ipsum:lorem'});
    await userEvent.click(button);

    expect(screen.getByText('ipsum:lorem expanded')).toBeVisible();
    expect(window.localStorage.getItem(fullCollapsedKey)).toEqual('[]');
  });

  it('toggles a key to collapsed', async () => {
    const fullCollapsedKey = buildStorageKey('', COLLAPSED_STORAGE_KEY);
    window.localStorage.setItem(fullCollapsedKey, JSON.stringify([]));
    render(<Test />);

    const button = await screen.findByRole('button', {name: 'toggle ipsum:lorem'});
    await userEvent.click(button);

    expect(screen.getByText('ipsum:lorem collapsed')).toBeVisible();
    expect(window.localStorage.getItem(fullCollapsedKey)).toEqual(JSON.stringify(['ipsum:lorem']));
  });

  it('toggles all to expanded', async () => {
    const fullCollapsedKey = buildStorageKey('', COLLAPSED_STORAGE_KEY);
    window.localStorage.setItem(fullCollapsedKey, JSON.stringify(['ipsum:lorem', 'amet:dolorsit']));
    render(<Test />);

    const button = await screen.findByRole('button', {name: 'expand all'});
    await userEvent.click(button);

    // Everything expanded!
    expect(screen.getByText('ipsum:lorem expanded')).toBeVisible();
    expect(screen.getByText('amet:dolorsit expanded')).toBeVisible();
    expect(screen.getByText('adipiscing:consectetur expanded')).toBeVisible();
  });

  it('toggles all to collapsed', async () => {
    const fullCollapsedKey = buildStorageKey('', COLLAPSED_STORAGE_KEY);
    window.localStorage.setItem(fullCollapsedKey, JSON.stringify(['ipsum:lorem']));
    render(<Test />);

    const button = await screen.findByRole('button', {name: 'collapse all'});
    await userEvent.click(button);

    // Everything collapsed!
    expect(screen.getByText('ipsum:lorem collapsed')).toBeVisible();
    expect(screen.getByText('amet:dolorsit collapsed')).toBeVisible();
    expect(screen.getByText('adipiscing:consectetur collapsed')).toBeVisible();
  });
});
