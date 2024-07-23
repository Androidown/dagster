import {GraphQueryItem} from '../app/GraphQueryImpl';
import {IStepState} from '../runs/RunMetadataProvider';

export type IGanttNode = GraphQueryItem;

export interface GanttViewport {
  left: number; // Note: pixel values
  top: number;
  width: number;
  height: number;
}

export interface GanttChartPlacement {
  key: string; // A React-friendly unique key like `step:retry-1`
  width: number;
  x: number; // Note: This is a pixel value
  y: number; // Note: This is a "row number" not a pixel value
}

export interface GanttChartBox extends GanttChartPlacement {
  state: IStepState | undefined;
  children: GanttChartBox[];
  node: IGanttNode;
  root: boolean;
}

export interface GanttChartMarker extends GanttChartPlacement {}

export interface GanttChartLayout {
  boxes: GanttChartBox[];

  // only present in timescaled layout
  markers: GanttChartMarker[];
}

export interface GanttChartLayoutOptions {
  mode: GanttChartMode;
  zoom: number; // 1 => 100
  hideWaiting: boolean;
  hideTimedMode: boolean;
  hideUnselectedSteps: boolean;
}

export enum GanttChartMode {
  FLAT = 'flat',
  WATERFALL = 'waterfall',
  WATERFALL_TIMED = 'waterfall-timed',
}

export const MIN_SCALE = 0.0002;
export const MAX_SCALE = 0.5;
export const LEFT_INSET = 16;
export const TOP_INSET = 16;
export const BOTTOM_INSET = 48;
export const FLAT_INSET_FROM_PARENT = 16;
export const BOX_HEIGHT = 34;
export const BOX_MARGIN_Y = 5;
export const BOX_SPACING_X = 20;
export const BOX_WIDTH = 200;
export const BOX_DOT_WIDTH_CUTOFF = 8;
export const BOX_SHOW_LABEL_WIDTH_CUTOFF = 30;
export const BOX_DOT_SIZE = 6;
export const BOX_DOT_MARGIN_Y = (BOX_HEIGHT - BOX_DOT_SIZE) / 2;

export const LINE_SIZE = 2;
export const CSS_DURATION = 100;

export const DEFAULT_OPTIONS: GanttChartLayoutOptions = {
  mode: GanttChartMode.WATERFALL,
  hideWaiting: false,
  hideTimedMode: false,
  zoom: 1,
  hideUnselectedSteps: false,
};
