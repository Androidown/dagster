import {Colors, FontFamily} from '@dagster-io/ui-components';
import styled from 'styled-components';

import {lazy} from '../util/lazy';

const MarkdownWithPlugins = lazy(() => import('./MarkdownWithPlugins'));

interface Props {
  children: string;
}

export const Markdown = (props: Props) => {
  return (
    <Container>
      <MarkdownWithPlugins {...props} />
    </Container>
  );
};

const Container = styled.div`
  &&& table {
    border: none;
    font-family: ${FontFamily.monospace};
    font-size: 14px;
  }

  &&& table tr th {
    box-shadow: none !important;
    color: ${Colors.textLight()};
    font-family: ${FontFamily.default};
    font-size: 12px;
    font-weight: normal;
    padding: 2px 8px;
    text-align: left;
  }

  &&& table tr td {
    box-shadow: none !important;
    padding: 2px 8px;
    font-variant-ligatures: none;
  }

  &&& table tr th:last-child,
  &&& table tr td:last-child {
    padding-right: 0;
  }
`;
