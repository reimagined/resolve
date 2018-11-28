import { EOL } from 'os'
import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import https from 'https'
import commandLineArgs from 'command-line-args'
import validateProjectName from 'validate-npm-package-name'
import AdmZip from 'adm-zip'
import { execSync } from 'child_process'

import prepareOptions from './prepare-options'
import startCreatingApplication from './start-creating-application'
import checkApplicationName from './check-application-name'
import downloadResolveRepo from './download-resolve-repo'
import testExampleExists from './test-example-exists'
import moveExample from './move-example'
import patchPackageJson from './patch-package-json'
import install from './install'
import printFinishOutput from './print-finish-output'
import sendAnalytics from './send-analytics'
import message from './message'
import isYarnAvailable from './is-yarn-available'
import safeName from './safe-name'
import pipeline from './pipeline'

pipeline({
  EOL,
  fs,
  path,
  chalk,
  https,
  AdmZip,
  execSync,
  commandLineArgs,
  validateProjectName,
  process,
  console,
  prepareOptions,
  startCreatingApplication,
  checkApplicationName,
  downloadResolveRepo,
  testExampleExists,
  moveExample,
  patchPackageJson,
  install,
  printFinishOutput,
  sendAnalytics,
  message,
  isYarnAvailable,
  safeName
})
