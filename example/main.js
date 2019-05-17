"use strict";
// create mocha instance
const Mocha = require("mocha");
let mochaMain = new Mocha({
    reporter: "./lib/mocha-rp-reporter.js",
    reporterOptions: {
        endpoint: "",
        token: "",
        launch: "",
        project: ""
    },
    timeout: 250000
});

// run tests
try{
    mochaMain.files = ["./example/test.js"];
    mochaMain.run((failures) => process.on('exit', () => process.exit(failures))); // exit with non-zero exit code, other wise fails will not fail mocha run
} catch (err) {
    console.error(`Test suite doesn't exists or set. Error: ${err}`);
}
