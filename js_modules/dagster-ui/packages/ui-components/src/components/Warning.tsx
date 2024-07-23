import * as React from 'react';
import styled from 'styled-components';

import {Colors} from './Color';
import {Icon} from './Icon';

interface Props {
  children: React.ReactNode;
  errorBackground?: boolean;
}

export const Warning = ({errorBackground, children}: Props) => {
  return (
    <ErrorContainer errorBackground={errorBackground}>
      <Icon name="warning" size={16} color={Colors.accentGray()} style={{marginRight: 8}} />
      {children}
    </ErrorContainer>
  );
};

const ErrorContainer = styled.div<{errorBackground?: boolean}>`
  border-top: 1px solid ${Colors.keylineDefault()};
  background: ${({errorBackground}) =>
    errorBackground ? Colors.backgroundRed() : Colors.backgroundLight()};
  padding: 8px 24px 8px 24px;
  display: flex;
  align-items: center;
  font-size: 12px;
`;
