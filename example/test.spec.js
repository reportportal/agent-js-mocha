const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const PublicReportingAPI = require('../lib/publicReportingAPI');

const attachments = [
  {
    filename: 'test.jpg',
    type: 'image/jpg',
  },
  {
    filename: 'test.png',
    type: 'image/png',
  },
  {
    filename: 'test.html',
    type: 'text/html',
  },
  {
    filename: 'test.json',
    type: 'application/json',
  },
  {
    filename: 'test.css',
    type: 'application/css',
  },
  {
    filename: 'test.mp4',
    type: 'video/mp4',
  },
];

describe('describe', function() {
  let foo = '';
  before(function() {
    PublicReportingAPI.setDescription('root describe');
    PublicReportingAPI.setTestCaseId('describe_test_case_id');
    foo = 'bar';
  });

  beforeEach(function() {
    foo = 'bar';
    return setTimeout(() => {}, 100);
  });

  it('test with logs and attachments', async function() {
    PublicReportingAPI.launchLog('INFO', 'launch log with manually specified info level');
    PublicReportingAPI.launchInfo('info launch log');
    PublicReportingAPI.launchDebug('debug launch log');
    PublicReportingAPI.launchTrace('trace launch log');
    PublicReportingAPI.launchWarn('warn launch log');
    PublicReportingAPI.launchError('error launch log');
    PublicReportingAPI.launchFatal('fatal launch log');
    PublicReportingAPI.debug('debug log');
    PublicReportingAPI.trace('trace log');
    PublicReportingAPI.warn('warning');
    PublicReportingAPI.error('error log');
    PublicReportingAPI.fatal('fatal log');
    expect(true).to.be.equal(true);
    const readFilesPromises = attachments.map(
      ({ filename, type }) =>
        new Promise((resolve) =>
          fs.readFile(path.resolve(__dirname, './attachments', filename), (err, data) => {
            if (err) {
              throw err;
            }
            const attachment = {
              name: filename,
              type,
              content: data.toString('base64'),
            };
            PublicReportingAPI.info('info log with attachment', attachment);
            resolve();
          }),
        ),
    );
    await Promise.all(readFilesPromises);
  });

  it('test pass', function() {
    PublicReportingAPI.setDescription('passed test description');
    PublicReportingAPI.addAttributes([{ key: 'state', value: 'stable' }]);
    PublicReportingAPI.setTestCaseId('test_pass_test_case_id');
    expect(true).to.be.equal(true);
  });

  it('test fail', function() {
    PublicReportingAPI.addAttributes([{ value: 'most failed' }]);
    PublicReportingAPI.addAttributes([{ value: 'never passed' }]);
    expect(true).to.be.equal(false);
  });

  it('test pending');

  it('test info', function() {
    PublicReportingAPI.info('test info log');
    PublicReportingAPI.setLaunchStatusInfo();
    PublicReportingAPI.setStatusInfo();
    expect(true).to.be.equal(true);
  });

  it('test fail with 3 reties', function() {
    this.retries(3);
    expect(true).to.be.equal(false);
  });

  after(function() {
    foo = 'bar';
  });

  afterEach(function() {
    foo = 'bar';
  });
});
