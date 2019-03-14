### Mocha reporter for EPAM report portal [clone of https://github.com/fedoseev-vitaliy/mocha-rp-reporter]
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
        endpoint: "",
        token: "",
        launch: "",
        project: ""
    }
});
```


