/*
 *  Copyright 2024 EPAM Systems
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
const ReportportalAgent = require('./../lib/mochaReporter');
const { getDefaultConfig } = require('./mocks');

describe('promiseErrorHandler', function () {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should handle promise rejection with error message', async () => {
    const error = new Error('Test error');
    // Mock the RPClient to return a rejected promise
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    const reporter = new ReportportalAgent(runner, options);
    const mockPromise = Promise.reject(error);
    reporter.rpClient.sendLog = jest.fn().mockReturnValue({
      promise: mockPromise,
    });

    // This should trigger the promiseErrorHandler
    reporter.sendLog('testId', { level: 'ERROR', message: 'test' });

    // Wait for the promise to be rejected and handled
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to send log.', error);
  });
});
