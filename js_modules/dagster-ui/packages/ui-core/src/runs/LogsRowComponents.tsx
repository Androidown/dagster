import {Box, Colors, FontFamily, MetadataTable, Tooltip} from '@dagster-io/ui-components';
import memoize from 'lodash/memoize';
import qs from 'qs';
import * as React from 'react';
import {Link, useLocation} from 'react-router-dom';
import styled from 'styled-components';

import {LogLevel} from './LogLevel';
import {ColumnWidthsContext} from './LogsScrollingTableHeader';
import {formatElapsedTimeWithMsec} from '../app/Util';
import {HourCycle} from '../app/time/HourCycle';
import {TimeContext} from '../app/time/TimeContext';
import {browserHourCycle, browserTimezone} from '../app/time/browserTimezone';
import {TimestampDisplay} from '../schedules/TimestampDisplay';

const bgcolorForLevel = (level: LogLevel) =>
  ({
    [LogLevel.DEBUG]: Colors.backgroundDefault(),
    [LogLevel.INFO]: Colors.backgroundDefault(),
    [LogLevel.EVENT]: Colors.backgroundDefault(),
    [LogLevel.WARNING]: Colors.backgroundYellow(),
    [LogLevel.ERROR]: Colors.backgroundRed(),
    [LogLevel.CRITICAL]: Colors.backgroundRed(),
  })[level];

export const MAX_ROW_HEIGHT_PX = 200;

export const Row = styled.div<{level: LogLevel; highlighted: boolean}>`
  font-size: 12px;
  width: 100%;
  height: 100%;
  max-height: ${MAX_ROW_HEIGHT_PX}px;
  word-break: break-word;
  white-space: pre-wrap;
  color: ${Colors.textDefault()};
  font-family: ${FontFamily.monospace};
  font-variant-ligatures: none;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  overflow: hidden;
  border-top: 1px solid ${Colors.keylineDefault()};
  background-color: ${({highlighted, level}) =>
    highlighted ? Colors.backgroundLightHover() : bgcolorForLevel(level)};

  color: ${(props) =>
    ({
      [LogLevel.DEBUG]: Colors.textLight(),
      [LogLevel.INFO]: Colors.textDefault(),
      [LogLevel.EVENT]: Colors.textDefault(),
      [LogLevel.WARNING]: Colors.textYellow(),
      [LogLevel.ERROR]: Colors.textRed(),
      [LogLevel.CRITICAL]: Colors.textRed(),
    })[props.level]};
`;

export const StructuredContent = styled.div`
  box-sizing: border-box;
  border-left: 1px solid ${Colors.keylineDefault()};
  word-break: break-word;
  white-space: pre-wrap;
  font-family: ${FontFamily.monospace};
  font-variant-ligatures: none;
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: baseline;
`;

// Step Key Column
//
// Renders the left column with the step key broken into hierarchical components.
// Manually implements middle text truncation since we can count on monospace font
// rendering being fairly consistent.
//
export const OpColumn = (props: {stepKey: string | false | null}) => {
  const widths = React.useContext(ColumnWidthsContext);
  const parts = String(props.stepKey).split('.');
  return (
    <OpColumnContainer style={{width: widths.solid}}>
      {props.stepKey
        ? parts.map((p, idx) => (
            <div
              key={idx}
              data-tooltip={p}
              data-tooltip-style={OpColumnTooltipStyle}
              style={{
                marginLeft: Math.max(0, idx * 15 - 9),
                fontWeight: idx === parts.length - 1 ? 600 : 300,
              }}
            >
              {idx > 0 ? '↳' : ''}
              {p.length > 30 - idx * 2
                ? `${p.substr(0, 16 - idx * 2)}…${p.substr(p.length - 14)}`
                : p}
            </div>
          ))
        : '-'}
    </OpColumnContainer>
  );
};

export const OpColumnContainer = styled.div`
  width: 250px;
  flex-shrink: 0;
  padding: 4px 12px;
`;

const OpColumnTooltipStyle = JSON.stringify({
  fontSize: '12px',
  fontFamily: FontFamily.monospace,
  color: Colors.textDefault(),
  background: Colors.backgroundDefault(),
  border: `1px solid ${Colors.keylineDefault()}`,
  top: -8,
  left: 1,
});

const timestampFormat = memoize(
  (timezone: string, hourCycle: HourCycle) => {
    const evaluatedHourCycle = hourCycle === 'Automatic' ? browserHourCycle() : hourCycle;
    return new Intl.DateTimeFormat(navigator.language, {
      hour: evaluatedHourCycle === 'h23' ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: evaluatedHourCycle,
      timeZone: timezone === 'Automatic' ? browserTimezone() : timezone,
    });
  },
  (timezone, hourCycle) => `${timezone}-${hourCycle}`,
);

// Timestamp Column

interface TimestampColumnProps {
  time: string | null;
  runStartTime?: number;
  stepStartTime?: number;
}

export const TimestampColumn = React.memo((props: TimestampColumnProps) => {
  const {time, runStartTime, stepStartTime} = props;
  const location = useLocation();
  const widths = React.useContext(ColumnWidthsContext);
  const {
    timezone: [timezone],
    hourCycle: [hourCycle],
  } = React.useContext(TimeContext);
  const canShowTooltip = typeof time === 'string' && typeof runStartTime === 'number';

  const timeString = () => {
    if (time) {
      const date = new Date(Number(time));
      return timestampFormat(timezone, hourCycle).format(date);
    }
    return '';
  };

  const href = `${location.pathname}?${qs.stringify({focusedTime: props.time})}`;
  const runElapsedTime = formatElapsedTimeWithMsec(Number(time) - (runStartTime || 0));
  const stepElapsedTime = formatElapsedTimeWithMsec(Number(time) - (stepStartTime || 0));

  return (
    <TimestampColumnContainer style={{width: widths.timestamp}}>
      <Tooltip
        canShow={canShowTooltip}
        content={
          <div>
            <Box margin={{bottom: 8}}>
              <TimestampDisplay
                timestamp={Number(time) / 1000}
                timeFormat={{showSeconds: true, showMsec: true, showTimezone: false}}
              />
            </Box>
            <MetadataTable
              spacing={0}
              rows={[
                {
                  key: 'Since start of run',
                  value: (
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: FontFamily.monospace,
                        fontSize: '13px',
                      }}
                    >
                      {runElapsedTime}
                    </div>
                  ),
                },
                stepStartTime
                  ? {
                      key: 'Since start of step',
                      value: (
                        <div
                          style={{
                            textAlign: 'right',
                            fontFamily: FontFamily.monospace,
                            fontSize: '13px',
                          }}
                        >
                          {stepElapsedTime}
                        </div>
                      ),
                    }
                  : null,
              ]}
            />
          </div>
        }
        placement="left"
      >
        <Link to={href}>{timeString()}</Link>
      </Tooltip>
    </TimestampColumnContainer>
  );
});

const TimestampColumnContainer = styled.div`
  flex-shrink: 0;
  padding: 4px 4px 4px 12px;

  a:link,
  a:visited,
  a:hover,
  a:active {
    color: ${Colors.textLight()};
  }

  a:hover,
  a:active {
    text-decoration: underline;
  }
`;

export const EventTypeColumn = (props: {children: React.ReactNode}) => {
  const widths = React.useContext(ColumnWidthsContext);
  return (
    <EventTypeColumnContainer style={{width: widths.eventType}}>
      {props.children}
    </EventTypeColumnContainer>
  );
};

const EventTypeColumnContainer = styled.div`
  flex-shrink: 0;
  color: ${Colors.textLight()};
  padding: 4px;
`;
