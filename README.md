### Mocha reporter for EPAM report portal [clone of https://github.com/fedoseev-vitaliy/mocha-rp-reporter]
This is mocha runtime reporter for [EPAM report portal](https://github.com/reportportal/reportportal).

It was designed to work with mocha programmatically, in order to be able to parametrize each test run.


#### Instalation steps:

` npm install rp-mocha-reporter`

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

#### Run test example:
For running test example clone **agent-js-mocha**.
In the working directory run
```npm install```  - that would install all dependencies.

```npm run test``` - that would run example tests.