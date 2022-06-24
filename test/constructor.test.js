/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const EventEmitter = require('events');
const { getDefaultConfig } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

describe('constructor', function () {
  test('should create RP client instance with passed options', function () {
    const options = getDefaultConfig();
    const runner = new EventEmitter();

    const reporter = new ReportportalAgent(runner, options);

    expect(reporter.rpClient).toBeDefined();
    expect(reporter.options).toEqual(options);
  });

  test('should override default options', function () {
    const options = getDefaultConfig();
    options.reporterOptions.launch = 'NewLaunchName';
    options.reporterOptions.rerun = true;
    const runner = new EventEmitter();

    const reporter = new ReportportalAgent(runner, options);

    expect(reporter.options.reporterOptions.launch).toEqual('NewLaunchName');
    expect(reporter.options.reporterOptions.rerun).toEqual(true);
  });
});
