import {Redirect, Switch} from 'react-router-dom';

import {AutomationAutomaterializeRoot} from './AutomationAutomaterializeRoot';
import {AutomationBackfillsRoot} from './AutomationBackfillsRoot';
import {AutomationSchedulesRoot} from './AutomationSchedulesRoot';
import {AutomationSensorsRoot} from './AutomationSensorsRoot';
import {MergedAutomationRoot} from './MergedAutomationRoot';
import {Route} from '../app/Route';
import {BackfillPage} from '../instance/backfill/BackfillPage';

export const AutomationRoot = () => {
  return (
    <Switch>
      <Route path="/automation/schedules">
        <AutomationSchedulesRoot />
      </Route>
      <Route path="/automation/sensors">
        <AutomationSensorsRoot />
      </Route>
      <Route path="/automation/backfills/:backfillId">
        <BackfillPage />
      </Route>
      <Route path="/automation/backfills" exact>
        <AutomationBackfillsRoot />
      </Route>
      <Route path="/automation/auto-materialize" exact>
        <AutomationAutomaterializeRoot />
      </Route>
      {/* Hidden route. MergedAutomationRoot should become `/automation`. */}
      <Route path="/automation/merged" exact>
        <MergedAutomationRoot />
      </Route>
      <Route path="*" render={() => <Redirect to="/automation/schedules" />} />
    </Switch>
  );
};

// Imported via React.lazy, which requires a default export.
// eslint-disable-next-line import/no-default-export
export default AutomationRoot;
