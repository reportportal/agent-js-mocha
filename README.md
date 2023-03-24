# @reportportal/agent-js-mocha

Agent to integrate Mocha with ReportPortal.
* More about [Mocha](https://playwright.dev/)
* More about [ReportPortal](http://reportportal.io/)

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.

## Installation

```cmd
npm install @reportportal/agent-js-mocha
```

## How to use:
Fill reporterOptions in Mocha configuration.
```javascript
const Mocha = require("mocha");
let mochaMain = new Mocha({
  reporter: '@reportportal/agent-js-mocha',
  reporterOptions: {
    "token": "00000000-0000-0000-0000-000000000000",
    "endpoint": "https://your.reportportal.server/api/v1",
    "project": "YourReportPortalProjectName",
    "launch": "YourLauncherName",
    "attributes": [
      {
        "key": "YourKey",
        "value": "YourValue"
      },
      {
        "value": "YourValue"
      },
    ]
  }
});
```
Using `.mocharc.js`:
```javascript
module.exports = {
  'extension': ['js', 'cjs', 'mjs'],
  'package': './package.json',
  reporter: '@reportportal/agent-js-mocha',
  'reporter-option':[
    'endpoint=https://your.reportportal.server/api/v1',
    'token=00000000-0000-0000-0000-000000000000',
    'launch=YourLauncherName',
    'project=YourReportPortalProjectName',
    'attributes=YourKey:YourValue;YourValue',
  ],
  'file': [
    'spec/someTest.spec.js',
  ]
}

```

#### You can find an example of using Mocha Reporter [here](https://github.com/reportportal/examples-js/tree/master/example-mocha).

### Options

Runs support following options:

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user.|
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.
| mode               | *Default: "DEFAULT".* Results will be submitting to Launches tab<br> *"DEBUG"* - Results will be submitting to Debug tab (Values must be upper case).                                                          |
| rerun                 | *Default: false.* Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)|
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|
| reportHooks           | *Default: false.* Determines report before and after hooks or not.                                                |
| skippedIssue          | *Default: true.* ReportPortal provides feature to mark skipped tests as not 'To Investigate' items on WS side.<br> Parameter could be equal boolean values:<br> *TRUE* - skipped tests considered as issues and will be marked as 'To Investigate' on Report Portal.<br> *FALSE* - skipped tests will not be marked as 'To Investigate' on application.|

### Additional reporting functionality

The agent provides an API to extend the functionality of Mocha.

Import the PublicReportingAPI as shown below to use additional reporting features.

```javascript
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI');
```
#### Report logs and attachments
PublicReportingAPI provides the following methods for reporting logs into the current test/step.

* log(*level*, *message* , *file*). Reports *message* and optional *file* with specified log *level* as a log of the current test. If called outside of the test, reports message as a log of the current suite.<br/>
*level* shoud be equal to one the following values: *TRACE*, *DEBUG*, *INFO*, *WARN*, *ERROR*, *FATAL*.<br/>
*file* should be an object: <br/>
```javascript
{
  name: "filename",
  type: "image/png",  // media type
  content: data,  // file content represented as 64base string
}
```
* trace (*message* , *file*). Reports *message* and optional *file* as a log of the current test/suite with trace log level.
* debug (*message* , *file*). Reports *message* and optional *file* as a log of the current test/suite with debug log level.
* info (*message* , *file*). Reports *message* and optional *file* as log of the current test/suite with info log level.
* warn (*message* , *file*). Reports *message* and optional *file* as a log of the current test/suite with warning log level.
* error (*message* , *file*). Reports *message* and optional *file* as a log of the current test/suite with error log level.
* fatal (*message* , *file*). Reports *message* and optional *file* as a log of the current test/suite with fatal log level.

PublicReportingAPI provides the corresponding methods for reporting logs into the launch.
* launchLog (*level*, *message* , *file*). Reports *message* and optional *file* with the specified log *level* as a log of the current launch.
* launchTrace (*message* , *file*). Reports *message* and optional *file* as a log of the launch with trace log level.
* launchDebug (*message* , *file*). Reports *message* and optional *file* as a log of the launch with debug log level.
* launchInfo (*message* , *file*). Reports *message* and optional *file* as log of the launch with info log level.
* launchWarn (*message* , *file*). Reports *message* and optional *file* as a log of the launch with warning log level.
* launchError (*message* , *file*). Reports *message* and optional *file* as a log of the launch with error log level.
* launchFatal (*message* , *file*). Reports *message* and optional *file* as a log of the launch with fatal log level.

**Example:**
```javascript
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI');
...
describe('suite',()=>{
  it('test', () => {
    const attachment = {
      name: 'attachment.png',
      type: 'image/png',
      content: data.toString('base64'),
    }
    PublicReportingAPI.log('INFO', 'Info log message for test "test" with attachment', attachment);
    PublicReportingAPI.launchLog('ERROR', 'Error log message for current launch with attachment', attachment);
    PublicReportingAPI.trace('Trace log message for test "test"', attachment);
    PublicReportingAPI.debug('Debug log message for test "test"');
    PublicReportingAPI.info('Info log message for test "test" with attachment');
    PublicReportingAPI.warn('Warning for test "test"');
    PublicReportingAPI.error('Error log message for test "test"');
    PublicReportingAPI.fatal('Fatal log message for test "test"');
  });
});
```
#### Report attributes for steps and suites

**addAttributes (*attributes*)**. Add attributes(tags) to the current test/suite. Should be called inside of corresponding test or suite.</br>
*attributes* is array of pairs of key and value:
```javascript
[{
  key: "attributeKey1",
  value: "attributeValue2",
}]
```
*Key* is optional field.

Mocha doesn't allow functional calls directly into describe section. You can call addAttributes inside of before/after hooks to add attributes to the corresponding suite.

**Example:**
```javascript
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI');
...
describe('suite',()=>{
  before(function (){
    PublicReportingAPI.addAttributes([{ key: 'suiteAttr1Key', value: 'suiteAttr1Value' }, { value: 'suiteAttr2' }]);
  });
  it('test', () => {
    PublicReportingAPI.addAttributes([{ key: 'testAttr1Key', value: 'testAttr1Value' }]);
    PublicReportingAPI.addAttributes([{ value: 'testAttr2' }]);
  });
});
```

#### Integration with Sauce Labs

To integrate with Sauce Labs just add attributes:

```javascript
[{
 "key": "SLID",
 "value": "# of the job in Sauce Labs"
}, {
 "key": "SLDC",
 "value": "EU (EU or US)"
}]
```

#### Report description for steps and suites

**setDescription (*description*)**. Set text description to the current test/suite. Should be called inside of corresponding test or suite.</br>

Mocha doesn't allow functional calls directly into describe section. You can call setDescription inside of before/after hooks to set description to the corresponding suite.

**Example:**
```javascript
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI');
...
describe('suite',()=>{
  before(function (){
    PublicReportingAPI.setDescription('suite description');
  });
  it('test', () => {
    PublicReportingAPI.setDescription('test description');
  });
});
```

#### Report test case id for steps and suites

**setTestCaseId (*testCaseId*)**. Set test case id to the current test/suite. Should be called inside of corresponding test or suite.</br>

Mocha doesn't allow functional calls directly into describe section. You can call setTestCaseId inside of before/after hooks to set test case id to the corresponding suite.

**Example:**
```javascript
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI');
...
describe('suite',()=>{
  before(function (){
    PublicReportingAPI.setTestCaseId('TestCaseIdForTheSuite'));
  });
  it('test', () => {
    PublicReportingAPI.setTestCaseId('TestCaseIdForTheTest'));
  });
});
```

#### Finish launch/test item with status

PublicReportingAPI provides the following methods for setting status to the current suite/spec.

* setStatus(*status*). Assign *status* to the current test. If called outside of the test (for example in before/after hooks), status is assigned to the current suite.<br/>
*status* should be equal to one of the following values: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*, *info*, *warn*.<br/>

You can use the shorthand forms of the setStatus method:

* setStatusPassed(). Assign *passed* status to the current test or suite.
* setStatusFailed(). Assign *failed* status to the current test or suite.
* setStatusSkipped(). Assign *skipped* status to the current test or suite.
* setStatusStopped(). Assign *stopped* status to the current test or suite.
* setStatusInterrupted(). Assign *interrupted* status to the current test or suite.
* setStatusCancelled(). Assign *cancelled* status to the current test or suite.
* setStatusInfo(). Assign *info* status to the current test or suite.
* setStatusWarn(). Assign *warn* status to the current test or suite.

There are also the corresponding methods for setting status into the launch:
* setLaunchStatus(*status*). Assign *status* to the launch.<br/>
*status* should be equal to one of the following values: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*, *info*, *warn*.<br/>
* setLaunchStatusPassed(). Assign *passed* status to the launch.
* setLaunchStatusFailed(). Assign *failed* status to the launch.
* setLaunchStatusSkipped(). Assign *skipped* status to the launch.
* setLaunchStatusStopped(). Assign *stopped* status to the launch.
* setLaunchStatusInterrupted(). Assign *interrupted* status to the launch.
* setLaunchStatusCancelled(). Assign *cancelled* status to the launch.
* setLaunchStatusInfo(). Assign *info* status to the launch.

**Example:**
```javascript
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI');
...
describe('suite',()=>{
  it('test info', function() {
    PublicReportingAPI.setStatusInfo();
    expect(true).to.be.equal(true);
  });
});
```

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)
