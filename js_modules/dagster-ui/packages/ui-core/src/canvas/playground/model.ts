import { Step, BranchedStep, Definition } from 'sequential-workflow-designer';

export interface WorkflowDefinition extends Definition {
	properties: {
		name?: string;
		alfa?: string;
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
		x?: string;
		y?: string;
	};
}

export interface CodeStep extends Step {
	componentType: 'code';
	type: 'code';
	properties: {
		code: string;
	};
}
