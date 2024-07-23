import {Box, ButtonLink, Caption, Colors, Icon, Mono} from '@dagster-io/ui-components';
import styled from 'styled-components';

import {AssetEventGroup} from './groupByPartition';
import {useStateWithStorage} from '../hooks/useStateWithStorage';
import {DagsterTag} from '../runs/RunTag';

// There can be other keys in the event tags, but we want to show data and code version
// at the top consistently regardless of their alphabetical / backend ordering.
const ORDER = [
  DagsterTag.AssetEventDataVersion.valueOf(),
  DagsterTag.AssetEventDataVersionDeprecated.valueOf(),
  DagsterTag.AssetEventCodeVersion.valueOf(),
];

export const AssetEventSystemTags = ({
  event,
  paddingLeft,
  collapsible,
}: {
  event: AssetEventGroup['latest'] | null;
  paddingLeft?: number;
  collapsible?: boolean;
}) => {
  const [shown, setShown] = useStateWithStorage('show-asset-system-tags', Boolean);

  if (collapsible && !shown) {
    return (
      <Caption>
        <ButtonLink onClick={() => setShown(true)}>
          <Box flex={{alignItems: 'center'}}>
            <span>Show tags ({event?.tags.length || 0})</span>
            <Icon name="arrow_drop_down" style={{transform: 'rotate(0deg)'}} />
          </Box>
        </ButtonLink>
      </Caption>
    );
  }

  return (
    <>
      <AssetEventSystemTagsTable>
        <tbody>
          {event?.tags.length ? (
            [...event.tags]
              .sort((a, b) => ORDER.indexOf(b.key) - ORDER.indexOf(a.key))
              .map((t) => (
                <tr key={t.key}>
                  <td style={{paddingLeft}}>
                    <Mono>{t.key.replace(DagsterTag.Namespace, '')}</Mono>
                  </td>
                  <td>{t.value}</td>
                </tr>
              ))
          ) : (
            <tr>
              <td style={{paddingLeft}}>No tags to display.</td>
            </tr>
          )}
        </tbody>
      </AssetEventSystemTagsTable>
      {collapsible && (
        <Caption>
          <ButtonLink onClick={() => setShown(false)}>
            <Box flex={{alignItems: 'center'}}>
              <span>Hide tags</span>
              <Icon name="arrow_drop_down" style={{transform: 'rotate(180deg)'}} />
            </Box>
          </ButtonLink>
        </Caption>
      )}
    </>
  );
};

const AssetEventSystemTagsTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;

  tr td:first-child {
    max-width: 300px;
    word-wrap: break-word;
    width: 25%;
  }
  tr td {
    border: 1px solid ${Colors.keylineDefault()};
    padding: 8px 12px;
    font-size: 14px;
    vertical-align: top;
  }
`;
