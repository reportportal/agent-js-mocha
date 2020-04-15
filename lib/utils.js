const path = require('path');
const pjson = require('./../package.json');

const getCodeRef = (testItem) => {
  const testFileDir = path
    .parse(path.normalize(path.relative(process.cwd(), testItem.file)))
    .dir.replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
  const testFile = path.parse(testItem.file);
  return `${testFileDir}/${testFile.name}${testFile.ext}/${testItem.titlePath().join('/')}`;
};

const getAgentInfo = () => ({
  version: pjson.version,
  name: pjson.name,
});

module.exports = { getCodeRef, getAgentInfo };
