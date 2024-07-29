import {useRootEditor} from 'sequential-workflow-designer-react';
import {WorkflowDefinition} from './model';
import {Heading, Table, Box, Button, TextInput} from '@dagster-io/ui-components';
import styled from 'styled-components';

import * as React from 'react';

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
  newFlow: (name: string) => void;
  saveFlow: (index: number) => Promise<void>;
  activeFlow: number;
}

export function RootEditor({WorkFlows, setCurrentFlow, deleteFlow, saveFlow,  newFlow, activeFlow}: Props) {
  const {properties, setProperty, isReadonly} = useRootEditor<WorkflowDefinition>();
  const [newFlowName, setNewFlowName] = React.useState('flow');

  return (
    <Box padding={{horizontal: 16}}>
      <Box padding={{vertical: 16}}>
        <Heading>Flow Definitions</Heading>
      </Box>
      <Box padding={{vertical: 16}} flex={{alignItems: 'center', justifyContent: 'space-between'}}>
        <Box flex={{direction: 'row', alignItems: 'center', gap: 12, grow: 0}}>
          <TextInput
            icon="job"
            // value={newFlowName}
            onChange={(e) => {
              setNewFlowName(e.target.value);
            }}
            placeholder="Create a new flow…"
            style={{width: '200px'}}
          />
          <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>
            <Button
              onClick={() => {
                newFlow(newFlowName);
              }}
            >
              New
            </Button>
          </Box>
        </Box>
      </Box>
      <Box padding={{vertical: 16}}>
        <Table>
          <thead>
            <tr>
              <th style={{width: '60%'}}>Flow Name</th>
              <th style={{width: '40%'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {WorkFlows.map((flow, idx) => {
              return (
                <Row highlighted={idx === activeFlow} key={idx}>
                  <td>
                    <b>{flow.properties.name}</b>
                  </td>
                  <td>
                    <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>
                      <ActionButton text="Open" onClick={() => setCurrentFlow(idx)} />
                      <ActionButton text="Save" onClick={() => saveFlow(idx)} />
                      <ActionButton text="Delete" onClick={() => deleteFlow(idx)} />
                    </Box>
                  </td>
                </Row>
              );
            })}
          </tbody>
        </Table>
      </Box>
    </Box>
  );
}
