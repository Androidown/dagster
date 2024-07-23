import 'sequential-workflow-designer/css/designer.css';
import 'sequential-workflow-designer/css/designer-light.css';
import 'sequential-workflow-designer/css/designer-dark.css';
import './index.css';

import {Heading, Page, PageHeader} from '@dagster-io/ui-components';
import React from 'react';

import {Playground} from './playground/Playground';

export const CanvasRoot = () => {
  return (
    <Page>
      <PageHeader title={<Heading>Canvas</Heading>} />
      <Playground />
    </Page>
  );
};

export default CanvasRoot;
