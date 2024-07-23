import {TabStyleProps, getTabA11yProps, getTabContent, tabCSS} from '@dagster-io/ui-components';
import * as React from 'react';
import {Link, LinkProps} from 'react-router-dom';
import styled from 'styled-components';

interface TabLinkProps extends TabStyleProps, Omit<LinkProps, 'title'> {
  title?: React.ReactNode;
}

export const TabLink = styled((props: TabLinkProps) => {
  const {to, title, disabled, ...rest} = props;
  const containerProps = getTabA11yProps(props);
  const content = getTabContent(props);

  const titleText = typeof title === 'string' ? title : undefined;

  return (
    <Link to={disabled ? '#' : to} title={titleText} {...containerProps} {...rest}>
      {content}
    </Link>
  );
})<TabLinkProps>`
  ${tabCSS}
`;
