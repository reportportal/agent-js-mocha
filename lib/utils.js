const path = require('path');

const getCodeRef = (testItem) => {
  const testFileDir = path
    .parse(path.normalize(path.relative(process.cwd(), testItem.file)))
    .dir.replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
  const testFile = path.parse(testItem.file);
  return `${testFileDir}/${testFile.name}${testFile.ext}:${testItem.titlePath().join('.')}`;
};

module.exports = { getCodeRef };
