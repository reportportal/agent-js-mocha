# Mocha reporter for EPAM report portal
This is mocha runtime reporter for [EPAM report portal](https://github.com/reportportal/reportportal).

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.

## Installation steps:

` npm install rp-mocha-reporter`

## How to use:
Fill reporterOptions in Mocha configuration. 
```javascript
const Mocha = require("mocha");
let mochaMain = new Mocha({
  reporter: 'mocha-rp-reporter',
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
### Options

Runs support following options:

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user.|
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.                                                    |
| rerun                 | Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)           |
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|
| skippedIssue          | ReportPortal provides feature to mark skipped tests as not 'To Investigate' items on WS side.<br> Parameter could be equal boolean values:<br> *TRUE* - skipped tests considered as issues and will be marked as 'To Investigate' on Report Portal.<br> *FALSE* - skipped tests will not be marked as 'To Investigate' on application.|

## Run test example:
For running test example clone [agent-js-mocha](https://github.com/reportportal/agent-js-mocha) and fill in [reporterOptions](#How-to-use).  

In the working directory run:  
1. ```npm install```  - that would install all dependencies.

2. ```npm example``` - that would run example tests.

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)
