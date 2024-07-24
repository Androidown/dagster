import { Uid } from 'sequential-workflow-designer';

import { CodeStep, MapStep, SwitchStep, TaskStep } from './model';


let codeStepCounter = 0

export function createTaskStep(): TaskStep {
  return {
    id: Uid.next(),
    componentType: 'task',
    type: 'task',
    name: 'test',
    properties: {},
  };
}

export function createSwitchStep(): SwitchStep {
  return {
    id: Uid.next(),
    componentType: 'switch',
    type: 'switch',
    name: 'if',
    properties: {},
    branches: {
      true: [],
      false: [],
    },
  };
}

export function createCodeStep(): CodeStep {
  return {
    id: Uid.next(),
    componentType: 'task',
    type: 'code',
    name: 'code',
    properties: {
      code: '',
    },
    sequence: []
  };
}


export function createMapStep(): MapStep {
  return {
    id: Uid.next(),
    componentType: 'switch',
    type: 'map',
    name: 'map',
    properties: {},
    branches: {
      b1: [],
      b2: [],
    },
  };
}
