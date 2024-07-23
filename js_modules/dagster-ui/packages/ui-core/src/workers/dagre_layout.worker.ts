/* eslint-disable no-restricted-globals */

import {layoutAssetGraph} from '../asset-graph/layout';
import {layoutOpGraph} from '../graph/layout';

/**
 * NOTE: Please avoid adding React as a transitive dependency to this file, as it can break
 * the development workflow. https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24
 *
 * If you see an error like `$RefreshReg$ is not defined` during development, check the
 * dependencies of this file. If you find that React has been included as a dependency, please
 * try to remove it.
 */

self.addEventListener('message', (event) => {
  const {data} = event;

  switch (data.type) {
    case 'layoutOpGraph': {
      const {ops, opts} = data;
      self.postMessage(layoutOpGraph(ops, opts));
      break;
    }
    case 'layoutAssetGraph': {
      const {graphData, opts} = data;
      self.postMessage(layoutAssetGraph(graphData, opts));
    }
  }
});
