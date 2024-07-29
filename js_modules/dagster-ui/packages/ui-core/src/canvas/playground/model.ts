import { Step, BranchedStep, Definition, SequentialStep } from 'sequential-workflow-designer';

export interface WorkflowDefinition extends Definition {
	properties: {
		name?: string;
	};
}

export interface TaskStep extends Step {
	componentType: 'task';
	type: 'task';
	properties: {
		x?: string;
		y?: string;
	};
}

export interface SwitchStep extends BranchedStep {
	componentType: 'switch';
	type: 'switch';
	properties: {
		condition: string
	};
}

export interface CodeStep extends SequentialStep {
	componentType: 'task';
	type: 'code';
	properties: {
		code: string;
	};
}


export interface MapStep extends BranchedStep {
	componentType: 'switch';
	type: 'map';
	properties: {
	};
}
