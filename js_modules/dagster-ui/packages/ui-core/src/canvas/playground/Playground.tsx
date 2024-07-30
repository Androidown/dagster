import {useEffect, useMemo, useState} from 'react';
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

import {RootEditor} from './RootEditor';
import {StepEditor} from './StepEditor';
import {createCodeStep, createMapStep, createSwitchStep} from './StepUtils';
import {WorkflowDefinition} from './model';
import IconPython from './python.svg';
import IconIf from './if.svg';
import IconMap from './map.svg';

const DummyFlow: WorkflowDefinition = {
  properties: {name: 'DUMMY'},
  sequence: [],
};

export function Playground() {
  const controller = useSequentialWorkflowDesignerController();
  const toolboxConfiguration: ToolboxConfiguration = useMemo(
    () => ({
      groups: [
        {
          name: 'Steps',
          steps: [createSwitchStep(), createCodeStep(), createMapStep()],
        },
      ],
    }),
    [],
  );
  const stepsConfiguration: StepsConfiguration = useMemo(
    () => ({
      iconUrlProvider: (componentType: string, type: string) => {
        switch (componentType) {
          case 'task':
            switch (type) {
              case 'code':
                return IconPython.src;
            }
            break;

          case 'switch':
            switch (type) {
              case 'map':
                return IconMap.src;
              case 'switch':
                return IconIf.src;
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

  const [flowDefinitions, setFlowDefinitions] = useState<WorkflowDefinition[]>([]);
  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [definition, setDefinitionInner] = useState(() => wrapDefinition(DummyFlow));
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

  useEffect(() => {
    async function fetchFlowDefinition() {
      const allFlowsPath = `${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}/all-flows?version=0`;
      const resp = await fetch(allFlowsPath, {
        method: 'GET',
        headers: new Headers({'content-type': 'application/json'}),
        mode: 'cors',
        credentials: 'same-origin',
      });

      const data = await resp.json();
      console.log('data: ', data);
      const flowDefs: WorkflowDefinition[] = data.data.map(
        (row: {name: string; definition: string}) => {
          return {
            properties: {name: row.name},
            sequence: JSON.parse(row.definition),
          } as WorkflowDefinition;
        },
      );
      setFlowDefinitions(flowDefs);
      if (flowDefs.length > 0) {
        setDefinitionInner(wrapDefinition(flowDefs[0]!));
      }
    }

    fetchFlowDefinition();
  }, []);

  function setDefinition(def: WrappedDefinition<WorkflowDefinition>, internal?: boolean) {
    if (!internal) {
      const newFlows = flowDefinitions.map((fl, i) => {
        if (i == activeFlowIndex) {
          return def.value;
        } else {
          return fl;
        }
      });
      setFlowDefinitions(newFlows);
    }
    setDefinitionInner(def);
  }

  function setCurrentFlow(index: number) {
    setActiveFlowIndex(index);
    setDefinition(wrapDefinition(flowDefinitions[index]!), true);
  }

  function newFlow(name: string) {
    const newFlowDef: WorkflowDefinition = {
      properties: {name},
      sequence: [],
    };
    setFlowDefinitions([...flowDefinitions, newFlowDef]);

    // force re-render
    setDefinitionInner(wrapDefinition(newFlowDef));
    if (flowDefinitions.length > 0) {
      setDefinitionInner(wrapDefinition(flowDefinitions[activeFlowIndex]!));
    }
  }

  async function deleteFlow(idx: number) {
    const dropFlowPath = `${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}/drop-flow`;
    await fetch(dropFlowPath, {
      method: 'POST',
      headers: new Headers({'content-type': 'application/json'}),
      body: JSON.stringify({
        name: flowDefinitions[idx]!.properties.name,
        version: 0,
      }),
      mode: 'cors',
      credentials: 'same-origin',
    });

    setFlowDefinitions(flowDefinitions.filter((_, i) => i !== idx));
    if (idx <= activeFlowIndex && activeFlowIndex > 0) {
      setCurrentFlow(activeFlowIndex - 1);
    } else {
      var flowDef: WorkflowDefinition;
      if (activeFlowIndex === 0 && idx === 0 && flowDefinitions.length > 0) {
        if (flowDefinitions.length > 1) {
          flowDef = flowDefinitions[1]!;
        } else {
          flowDef = {
            properties: {name: 'flow'},
            sequence: [],
          };
        }
      } else {
        flowDef = flowDefinitions[activeFlowIndex]!;
      }
      setDefinitionInner(wrapDefinition(flowDef));
    }
  }

  async function saveFlow(index: number) {
    const saveFlowPath = `${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}/save-flow`;
    await fetch(saveFlowPath, {
      method: 'POST',
      headers: new Headers({'content-type': 'application/json'}),
      body: JSON.stringify({
        name: flowDefinitions[index]!.properties.name,
        version: 0,
        definition: JSON.stringify(flowDefinitions[index]!.sequence),
      }),
      mode: 'cors',
      credentials: 'same-origin',
    });
    setCurrentFlow(index);
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
            saveFlow={saveFlow}
            WorkFlows={flowDefinitions}
            setCurrentFlow={setCurrentFlow}
          />
        }
        stepEditor={<StepEditor flowName={definition.value.properties.name} />}
        isEditorCollapsed={isEditorCollapsed}
        onIsEditorCollapsedChanged={setIsEditorCollapsed}
        controller={controller}
      />
    </>
  );
}
