import {ChangeEvent, ReactElement, useState} from 'react';
import {useStepEditor} from 'sequential-workflow-designer-react';
import {Heading, Box, TextInput, Button, Table} from '@dagster-io/ui-components';

import {CodeStep, MapStep, SwitchStep, TaskStep} from './model';
import styled from 'styled-components';
import {CodeEditor} from './CodeEditor';

function StepEditorHeader({children}: {children: ReactElement[] | ReactElement}) {
  return (
    <Box padding={{horizontal: 16}}>
      <Box padding={{top: 16, bottom: 8}}>
        <Heading>Step Editor</Heading>
      </Box>
      {children}
    </Box>
  );
}

const Row = styled.tr<{highlighted: boolean}>`
  ${({highlighted}) =>
    highlighted ? `box-shadow: inset 3px 3px #bfccd6, inset -3px -3px #bfccd6;` : null}
`;

function NamedStepEditor({
  children,
  name,
  setName,
}: {
  children: ReactElement;
  name: string;
  setName: (s: string) => void;
}) {
  function onNameChanged(e: ChangeEvent) {
    setName((e.target as HTMLInputElement).value);
  }
  return (
    <StepEditorHeader>
      <Box padding={{vertical: 8}}>
        <TextInput
          icon="edit"
          onChange={onNameChanged}
          value={name}
          placeholder="Enter step name..."
          style={{width: '250px'}}
        />
      </Box>
      {children}
    </StepEditorHeader>
  );
}

function CodeStepEditor() {
  const {name, properties, setName} = useStepEditor<CodeStep>();

  function onTextChange(c) {
    properties.code = c.main;
  }
  return (
    <NamedStepEditor name={name} setName={setName}>
      <CodeEditor onTextChange={onTextChange} code={properties.code} />
    </NamedStepEditor>
  );
}

function MapEditor() {
  const {step, notifyChildrenChanged} = useStepEditor<MapStep>();
  const [branchCount, setBranchCount] = useState(3);

  function newBranch() {
    step.branches[`b${branchCount}`] = [];
    setBranchCount(branchCount + 1);
    notifyChildrenChanged();
  }

  function deleteBranch(name: string) {
    delete step.branches[name];
    notifyChildrenChanged();
  }

  return (
    <StepEditorHeader>
      <Box padding={{vertical: 16}}>
        <Button onClick={newBranch}>New</Button>
      </Box>
      <Box padding={{vertical: 16}}>
        <Table>
          <thead>
            <tr>
              <th style={{width: '60%'}}>Branch Name</th>
              <th style={{width: '40%'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(step.branches).map((key, idx) => {
              return (
                <Row highlighted={false} key={idx}>
                  <td>
                    <b>{key}</b>
                  </td>
                  <td>
                    <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>
                      <Button onClick={() => deleteBranch(key)}>Delete</Button>
                    </Box>
                  </td>
                </Row>
              );
            })}
          </tbody>
        </Table>
      </Box>
    </StepEditorHeader>
  );
}

function SwitchEditor() {
  const {properties} = useStepEditor<SwitchStep>();

  function onTextChange(c) {
    properties.condition = c.main;
  }
  return (
    <StepEditorHeader>
      <CodeEditor onTextChange={onTextChange} code={properties.condition} />
    </StepEditorHeader>
  );
}

export function StepEditor() {
  const {type} = useStepEditor<TaskStep | SwitchStep | CodeStep | MapStep>();
  console.log('type:::', type);
  switch (type) {
    case 'code':
      return <CodeStepEditor />;
    case 'map':
      return <MapEditor />;
    case 'switch':
      return <SwitchEditor />;
  }

  return (
    <StepEditorHeader>
      <></>
    </StepEditorHeader>
  );
}
