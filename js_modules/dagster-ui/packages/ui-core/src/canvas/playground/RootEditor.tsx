import {ChangeEvent} from 'react';
import {useRootEditor, wrapDefinition, WrappedDefinition} from 'sequential-workflow-designer-react';
import {WorkflowDefinition} from './model';
import {Checkbox, JoinedButtons, Table} from '@dagster-io/ui-components';
import styled from 'styled-components';

import {AnchorButton} from '@blueprintjs/core';
import * as React from 'react';
import {Box, Button, ButtonGroup, ErrorBoundary, TextInput} from '@dagster-io/ui-components';

const Row = styled.tr<{highlighted: boolean}>`
  ${({highlighted}) =>
    highlighted ? `box-shadow: inset 3px 3px #bfccd6, inset -3px -3px #bfccd6;` : null}
`;

const ActionButton = ({text, onClick}: {text: string; onClick: () => void}) => {
  return (
    <>
      <Button onClick={onClick}>{text}</Button>
    </>
  );
};

interface Props {
  WorkFlows: WorkflowDefinition[];
  setCurrentFlow: (index: number) => void;
  deleteFlow: (index: number) => void;
  newFlow: (name: string) => void,
  activeFlow: number
}

export function RootEditor({
  WorkFlows, setCurrentFlow, deleteFlow, newFlow,
  activeFlow
}: Props) {
  const {properties, setProperty, isReadonly} = useRootEditor<WorkflowDefinition>();

  function onAlfaChanged(e: ChangeEvent) {
    setProperty('alfa', (e.target as HTMLInputElement).value);
  }

  const [newFlowName, setNewFlowName] = React.useState("flow");

  return (
    <>
      <h2>Flow</h2>
      <Box
        padding={{horizontal: 24, vertical: 16}}
        flex={{alignItems: 'center', justifyContent: 'space-between'}}
      >
        <Box flex={{direction: 'row', alignItems: 'center', gap: 12, grow: 0}}>
          <TextInput
            icon="job"
            // value={newFlowName}
            onChange={(e) => {setNewFlowName(e.target.value)}}
            placeholder="Create a new flow…"
            style={{width: '200px'}}
          />
          <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>
            <Button onClick={() => {newFlow(newFlowName)}}>New</Button>
          </Box>
        </Box>
      </Box>
      <Table>
        <thead>
          <tr>
            <th style={{width: '60%'}}>Flow Name</th>
            <th style={{width: '40%'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {WorkFlows.map((flow, idx) => {
            const [isHovered, setIsHovered] = React.useState(false);
            return (
              <Row
                highlighted={idx === activeFlow}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                key={idx}
              >
                <td>
                  <b>{flow.properties.name}</b>
                </td>
                <td>
                  <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>
                    <ActionButton text="Open" onClick={() => setCurrentFlow(idx)} />
                    <ActionButton text="Save" onClick={() => console.log('save flow:', flow)} />
                    <ActionButton text="Delete" onClick={() => deleteFlow(idx)} />
                  </Box>
                </td>
              </Row>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
