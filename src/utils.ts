/*
 *  Copyright 2020 EPAM Systems
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

const path = require('path')
export const getCodeRef = (testItem) => {
  const testFileDir = path
    .parse(path.normalize(path.relative(process.cwd(), testItem.file)))
    .dir.replace(new RegExp('\\'.concat(path.sep), 'g'), '/')
  const testFile = path.parse(testItem.file)
  return `${testFileDir}/${testFile.name}${testFile.ext}/${testItem
    .titlePath()
    .join('/')}`
}

export const getTimeStamp = (): number => new Date().valueOf()

export const getAgentInfo = () => ({
  version: '1.0.1',
  name: `@rtly-sdet/reportportal-agent`,
})
