import { useEffect, useMemo, useState } from 'react';
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
} from 'sequential-workflow-designer-react';

import { RootEditor } from './RootEditor';
import { StepEditor } from './StepEditor';
import { createCodeStep, createSwitchStep, createTaskStep } from './StepUtils';
import { WorkflowDefinition } from './model';
import PythonSVG from './python.svg';

const startDefinition: WorkflowDefinition = {
  properties: {
    alfa: 'bravo',
  },
  sequence: [createTaskStep(), createSwitchStep(), createCodeStep()],
};

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
      root: (definition: WorkflowDefinition) => Boolean(definition.properties.alfa),
    }),
    [],
  );

  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [definition, setDefinition] = useState(() => wrapDefinition(startDefinition));
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
        rootEditor={<RootEditor />}
        stepEditor={<StepEditor />}
        isEditorCollapsed={isEditorCollapsed}
        onIsEditorCollapsedChanged={setIsEditorCollapsed}
        controller={controller}
      />
    </>
  );
}
