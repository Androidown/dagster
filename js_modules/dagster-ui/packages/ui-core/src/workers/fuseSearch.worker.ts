/**
 * A Web Worker that creates and queries a Fuse object.
 */

import {Fuse} from '../search/fuse';

let fuseObject: any = null;

self.addEventListener('message', (event) => {
  const {data} = event;

  switch (data.type) {
    case 'set-results': {
      if (!fuseObject) {
        fuseObject = new Fuse(data.results, data.fuseOptions);
      } else {
        fuseObject.setCollection(data.results);
      }
      self.postMessage({type: 'ready'});
      break;
    }
    case 'query': {
      if (fuseObject) {
        const {queryString} = data;
        // Consider the empty string as returning no results.
        const results = queryString ? fuseObject.search(queryString) : [];
        self.postMessage({type: 'results', queryString, results});
      }
    }
  }
});
