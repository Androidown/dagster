// eslint-disable-next-line no-restricted-imports
import {Text} from '@blueprintjs/core';
import {Code, Colors, FontFamily, Group, Icon, IconWrapper} from '@dagster-io/ui-components';
import * as React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components';

import {SectionHeader} from './SidebarComponents';
import {titleOfIO} from '../app/titleOfIO';
import {OpColumn, OpColumnContainer} from '../runs/LogsRowComponents';

type OpLinkInfo = {
  solid: {name: string};
  definition: {name: string};
};

export interface SidebarOpInvocationInfo {
  handleID: string;
  pipelineName?: string;
}

export type OpMappingTable = {
  [key: string]: OpLinkInfo[];
};

export const ShowAllButton = styled.button`
  background: transparent;
  border: none;
  color: ${Colors.accentBlue()};
  text-decoration: underline;
  padding-top: 10px;
  font-size: 0.9rem;
`;

export const TypeWrapper = styled.div`
  margin-bottom: 10px;
`;

const OpLink = (props: OpLinkInfo) => (
  <Link to={`./${props.solid.name}`}>
    <Code>{titleOfIO(props)}</Code>
  </Link>
);

export const OpEdges = (props: {title: string; items: OpLinkInfo[]}) =>
  props.items && props.items.length ? (
    <Text>
      {props.title}
      {props.items.map((i, idx) => (
        <OpLink key={idx} {...i} />
      ))}
    </Text>
  ) : null;

export const Invocation = (props: {invocation: SidebarOpInvocationInfo; onClick: () => void}) => {
  const {handleID, pipelineName} = props.invocation;
  const handlePath = handleID.split('.');
  return (
    <InvocationContainer onClick={props.onClick}>
      {pipelineName && <div style={{color: Colors.textBlue()}}>{pipelineName}</div>}
      <OpColumn stepKey={handlePath.join('.')} />
    </InvocationContainer>
  );
};

export const DependencyRow = ({
  from,
  to,
  isDynamic,
}: {
  from: OpLinkInfo | string;
  to: OpLinkInfo | string;
  isDynamic: boolean | null;
}) => {
  return (
    <tr>
      <Cell>{typeof from === 'string' ? <Code>{from}</Code> : <OpLink {...from} />}</Cell>
      <td style={{whiteSpace: 'nowrap', textAlign: 'right'}}>
        <Group direction="row" spacing={2} alignItems="center">
          {isDynamic && <Icon name="op_dynamic" color={Colors.accentGray()} />}
          <Icon name="arrow_forward" color={Colors.accentGray()} />
        </Group>
      </td>
      <Cell>{typeof to === 'string' ? <Code>{to}</Code> : <OpLink {...to} />}</Cell>
    </tr>
  );
};

interface DependencyHeaderRowProps {
  label: string;
  style?: React.CSSProperties;
}

export const DependencyHeaderRow = ({label, ...rest}: DependencyHeaderRowProps) => (
  <tr>
    <DependencyHeaderCell {...rest}>{label}</DependencyHeaderCell>
  </tr>
);

export const ResourceHeader = styled(SectionHeader)`
  font-size: 14px;
`;

const Cell = styled.td`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 0;
  width: 48%;
`;

export const ResourceContainer = styled.div`
  display: flex;
  align-items: flex-start;
  & h4 {
    margin-top: 0;
  }
  & ${IconWrapper} {
    margin-right: 8px;
  }
`;

export const DependencyTable = styled.table`
  width: 100%;
`;

const DependencyHeaderCell = styled.td`
  font-size: 0.7rem;
  color: ${Colors.textLight()};
`;

const InvocationContainer = styled.div`
  user-select: none;
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 1px solid ${Colors.keylineDefault()};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${Colors.backgroundLight()};
  }

  font-family: ${FontFamily.monospace};

  ${OpColumnContainer} {
    margin-left: -12px;
  }
`;
