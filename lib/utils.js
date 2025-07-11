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

const clientHelpers = require('@reportportal/client-javascript/lib/helpers');
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

function getBeforeHookStartTime(itemStartTime) {
  return clientHelpers.formatMicrosecondsToISOString(
    convertIsoStringToMicroseconds(itemStartTime) - 1000,
  );
}

module.exports = {
  getCodeRef,
  getAgentInfo,
  parseAttributes,
  convertIsoStringToMicroseconds,
  getBeforeHookStartTime,
};
