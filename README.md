### Mocha reporter for EPAM report portal
This is mocha runtime reporter for [EPAM report portal](https://github.com/reportportal/reportportal).

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.


#### Instalation steps:

` npm install mocha-rp-reporter`

#### How to use:

```javascript
const Mocha = require("mocha");
let mochaMain = new Mocha({    
    reporter: 'mocha-rp-reporter',
    reporterOptions: {
        configFile: "path to config.json",
        configOptions: {
            endpoint: "EPAM report portal api url",
            username: "user",
            password: "password",
            launch: "execution name",
            project: "project name",
            tags: [
                "tag1", "tag2"
            ]
        }                        
    }
});
```

`config.json` should look like this:

```json
{
  "endpoint": "EPAM report portal api url",
  "username": "user",
  "password": "password",
  "launch": "execution name",
  "project": "project name",
  "tags": [
    "tag1", "tag2"
  ]
}
```

By default reporter will use `configOptions` otherwise will try to load file from `configFile`

######WARNING: Test execution will slow down due to sync request to RP 





