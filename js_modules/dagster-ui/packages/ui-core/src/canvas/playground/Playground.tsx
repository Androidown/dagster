import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Step,
  StepsConfiguration,
  ToolboxConfiguration,
  ValidatorConfiguration,
} from 'sequential-workflow-designer';
import {
  SequentialWorkflowDesigner,
  useSequentialWorkflowDesignerController,
  wrapDefinition,
  WrappedDefinition,
} from 'sequential-workflow-designer-react';

import { RootEditor } from './RootEditor';
import { StepEditor } from './StepEditor';
import { createCodeStep, createSwitchStep, createTaskStep } from './StepUtils';
import { WorkflowDefinition } from './model';
import PythonSVG from './python.svg';
import { flow } from 'lodash';


export function Playground() {
  const controller = useSequentialWorkflowDesignerController();
  const toolboxConfiguration: ToolboxConfiguration = useMemo(
    () => ({
      groups: [{name: 'Steps', steps: [createTaskStep(), createSwitchStep(), createCodeStep()]}],
    }),
    [],
  );
  const stepsConfiguration: StepsConfiguration = useMemo(
    () => ({
      iconUrlProvider: (componentType: string, type: string) => {
        if (componentType === 'task') {
          switch (type) {
            case 'code':
              return PythonSVG.src;
          }
        }
        return '';
      },
    }),
    [],
  );
  const validatorConfiguration: ValidatorConfiguration = useMemo(
    () => ({
      step: (step: Step) => Boolean(step.name),
      root: (definition: WorkflowDefinition) => true,
    }),
    [],
  );
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const flowDefs = [
    {properties: {name: 'step1'}, sequence: [createTaskStep()]},
    {properties: {name: 'step2'}, sequence: [createSwitchStep(), createCodeStep()]},
  ]
  const [flowSample, setFlowSample] = useState(flowDefs);
  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [definition, setDefinitionInner] = useState(() => wrapDefinition(flowDefs[0]!));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isReadonly, setIsReadonly] = useState(false);
  const [moveViewportToStep, setMoveViewportToStep] = useState<string | null>(null);

  useEffect(() => {
    if (moveViewportToStep) {
      if (controller.isReady()) {
        controller.moveViewportToStep(moveViewportToStep);
      }
      setMoveViewportToStep(null);
    }
  }, [controller, moveViewportToStep]);

  
  const [activeFlowIndex, setActiveFlowIndex] = useState(0);


  function setDefinition(def: WrappedDefinition<WorkflowDefinition>, internal?: boolean) {
    if (!internal) {
      const newFlows = flowSample.map((fl, i) => {
        if (i == activeFlowIndex) {
          return def.value
        } else {
          return fl
        }
      });
      setFlowSample(newFlows);
    }
    setDefinitionInner(def)
  }

  function setCurrentFlow(index: number) {
    setActiveFlowIndex(index);
    setDefinition(wrapDefinition(flowSample[index]!), true);
  }

  function newFlow(name: string) {
    const newFlowDef = {
      properties: {name},
      sequence: []
    };
    setFlowSample([
      ...flowSample,
      newFlowDef
    ]);

    // force re-render
    setDefinitionInner(wrapDefinition(newFlowDef));
    if (flowSample.length > 0) {
      setDefinitionInner(wrapDefinition(flowSample[activeFlowIndex]!));
    }
  }

  function deleteFlow(idx: number) {
    setFlowSample(flowSample.filter((_, i) => i !== idx))
    if (idx <= activeFlowIndex && activeFlowIndex > 0) {
      setCurrentFlow(activeFlowIndex - 1)
    } else {
      var flowDef;
      if (activeFlowIndex === 0 && idx === 0 && flowSample.length > 0) {
        if (flowSample.length > 1) {
          flowDef = flowSample[1]!;
        } else {
          flowDef = {
            properties: {name: "flow"},
            sequence: []
          }
        }
      } else {
        flowDef = flowSample[activeFlowIndex]!;
      }
      setDefinitionInner(wrapDefinition(flowDef))
    }
  }

  return (
    <>
      <SequentialWorkflowDesigner
        undoStackSize={10}
        definition={definition}
        onDefinitionChange={setDefinition}
        selectedStepId={selectedStepId}
        isReadonly={isReadonly}
        onSelectedStepIdChanged={setSelectedStepId}
        toolboxConfiguration={toolboxConfiguration}
        isToolboxCollapsed={isToolboxCollapsed}
        onIsToolboxCollapsedChanged={setIsToolboxCollapsed}
        stepsConfiguration={stepsConfiguration}
        validatorConfiguration={validatorConfiguration}
        controlBar={true}
        rootEditor={
          <RootEditor
            activeFlow={activeFlowIndex}
            newFlow={newFlow}
            deleteFlow={deleteFlow}
            WorkFlows={flowSample}
            setCurrentFlow={setCurrentFlow}
          />
        }
        stepEditor={<StepEditor />}
        isEditorCollapsed={isEditorCollapsed}
        onIsEditorCollapsedChanged={setIsEditorCollapsed}
        controller={controller}
      />
    </>
  );
}
