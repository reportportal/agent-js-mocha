### Mocha reporter for EPAM report portal
This is mocha runtime reporter for [EPAM report portal](https://github.com/reportportal/reportportal).

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.


#### Instalation steps:

1. ` git clone`
2. ` npm install`

#### How to use:
Fill in configOptions. 
```javascript
const Mocha = require("mocha");
let mochaMain = new Mocha({
    reporter: 'mocha-rp-reporter',
    reporterOptions: {
        configOptions: {
            endpoint: "",
            username: "",
            password: "00000000-0000-0000-0000-000000000000",
            launch: "",
            project: "",
            tags: [
                ""
            ]
        },
        configFile: "reportportal.json"
    }
});
```

`config.json` should look like this:

```json
{
  "endpoint": "EPAM report portal api url",
  "username": "user",
  "password": "00000000-0000-0000-0000-000000000000",
  "launch": "execution name",
  "project": "project name",
  "tags": [
    "tag1", "tag2"
  ]
}
```

By default reporter will use `configOptions` otherwise will try to load file from `configFile`

`npm run test` to start tests execution



