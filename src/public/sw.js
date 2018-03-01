/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* VERSION: 0.0.91 */
import {handler as root} from './scripts/routes/root.js';
import {handler as proxy} from './scripts/routes/proxy.js';
import {handler as all} from './scripts/routes/all.js';

import {getCompiledTemplate,
  paths,
  generateCSPPolicy,
  generateIncrementalNonce
} from './scripts/platform/common.js';
import {WorkboxSW} from './scripts/workbox-sw.js';
import {router} from './scripts/router.js';


const workbox = new WorkboxSW({skipWaiting: true, precacheChannelName: 'install-cache-channel'});
// This should pre-cache all of the required assets determined at buildtime.
workbox.precache([]);

getCompiledTemplate(`${paths.assetPath}templates/head.html`);

const setHeader = (response, header, value) => {
  response.headers.set(header, value);
  return response;
};
const generator = generateIncrementalNonce('service-worker');

/*
  Router logic.
*/

// The proxy server '/proxy'

router.get(`${self.location.origin}/proxy`, (e) => {
  const response = proxy(e.request, {
    dataPath: paths.dataPath,
    assetPath: paths.assetPath
  });

  e.respondWith(response);
}, {urlMatchProperty: 'href'});

// The proxy server '/all'
router.get(`${self.location.origin}/all$`, (e) => {
  const nonce = {
    analytics: generator(),
    inlinedcss: generator(),
    style: generator()
  };

  const response = all(nonce, {
    dataPath: paths.dataPath,
    assetPath: paths.assetPath
  }).then(r => setHeader(r, 'Content-Security-Policy', generateCSPPolicy(nonce)));
  e.respondWith(response);
}, {urlMatchProperty: 'href'});

// The root '/'
router.get(`${self.location.origin}/$`, (e) => {
  const nonce = {
    analytics: generator(),
    inlinedcss: generator(),
    style: generator()
  };

  const response = root(nonce, {
    dataPath: paths.dataPath,
    assetPath: paths.assetPath
  }).then(r => setHeader(r, 'Content-Security-Policy', generateCSPPolicy(nonce)));
  e.respondWith(response);
}, {urlMatchProperty: 'href'});
