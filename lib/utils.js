/*
 *  Copyright 2024 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const path = require('path');
const pjson = require('./../package.json');

function getFrameworkVersion() {
  const declaredVersion = (pjson.dependencies?.mocha || '').replace(/^\D+/, '');
  try {
    // eslint-disable-next-line global-require
    return require('mocha/package.json').version || declaredVersion;
  } catch {
    return declaredVersion;
  }
}

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
  framework_version: getFrameworkVersion(),
});

const parseAttributes = (attributes) => {
  if (typeof attributes === 'string') {
    return attributes.split(';').map((attributeStr) => {
      const attribute = attributeStr.split(':');
      return attribute.length === 2
        ? { key: attribute[0], value: attribute[1] }
        : { value: attribute[0] };
    });
  }
  return attributes;
};

// TODO: move to the client-javascript to be reusable by other agents
function convertIsoStringToMicroseconds(isoDateStringWithMicroseconds) {
  const [datePart, microsecondsPart] = isoDateStringWithMicroseconds.split('.');
  const date = new Date(`${datePart}Z`);
  const microseconds = parseInt(microsecondsPart.slice(0, -1), 10);

  return date.getTime() * 1000 + microseconds;
}

function formatMicrosecondsToISOString(totalMicroseconds) {
  const epochSeconds = Math.floor(totalMicroseconds / 1000000);
  const subSecondMicroseconds = totalMicroseconds % 1000000;
  const date = new Date(epochSeconds * 1000);
  const datePart = date.toISOString().split('.')[0];
  return `${datePart}.${String(subSecondMicroseconds).padStart(6, '0')}Z`;
}

function getBeforeHookStartTime(itemStartTime) {
  return formatMicrosecondsToISOString(convertIsoStringToMicroseconds(itemStartTime) - 1000);
}

module.exports = {
  getCodeRef,
  getAgentInfo,
  parseAttributes,
  convertIsoStringToMicroseconds,
  getBeforeHookStartTime,
};
