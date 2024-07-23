// eslint-disable-next-line no-restricted-imports
import {HTMLTable, HTMLTableProps} from '@blueprintjs/core';
import styled from 'styled-components';

import {StyledTag} from './BaseTag';
import {Colors} from './Color';
import {FontFamily} from './styles';

export interface TableProps extends HTMLTableProps {
  $compact?: boolean;
}

export const Table = styled(HTMLTable)<TableProps>`
  border: none;
  width: 100%;

  & tr th,
  & tr td {
    border: none;
    box-shadow:
      inset 0 1px 0 ${Colors.keylineDefault()},
      inset 1px 0 0 ${Colors.keylineDefault()} !important;
  }

  & tr th {
    color: ${Colors.textLight()};
    font-family: ${FontFamily.default};
    font-size: 12px;
    font-weight: 400;
    padding: ${({$compact}) => ($compact ? '4px 8px' : ' 8px 12px')};
    min-height: 32px;
    white-space: nowrap;
    vertical-align: bottom;
  }

  & tr th:first-child {
    padding-left: ${({$compact}) => ($compact ? '8px' : ' 24px')};
  }

  & tr td {
    color: ${Colors.textDefault()};
    font-family: ${FontFamily.default};
    font-size: 14px;
    line-height: 20px;
    padding: ${({$compact}) => ($compact ? '8px' : '12px')};
  }

  & tr td:first-child {
    padding-left: ${({$compact}) => ($compact ? '8px' : ' 24px')};
  }

  & tr:last-child td {
    box-shadow:
      inset 0 1px 0 ${Colors.keylineDefault()},
      inset 1px 0 0 ${Colors.keylineDefault()},
      inset 0 -1px 0 ${Colors.keylineDefault()} !important;
  }

  & tr td ${StyledTag} {
    font-family: ${FontFamily.default};
  }
`;
