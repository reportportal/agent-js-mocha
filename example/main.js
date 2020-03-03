// create mocha instance
const Mocha = require('mocha');

const mochaMain = new Mocha({
  reporter: './lib/mochaReporter.js',
  reporterOptions: {
    endpoint: '',
    token: '',
    launch: '',
    project: '',
    description: '',
  },
  timeout: 250000,
});

// run tests
try {
  mochaMain.files = ['./example/test.spec.js'];
  mochaMain.run((failures) => process.on('exit', () => process.exit(failures))); // exit with non-zero exit code, other wise fails will not fail mocha run
} catch (err) {
  console.error(`Test suite doesn't exists or set. Error: ${err}`);
}
