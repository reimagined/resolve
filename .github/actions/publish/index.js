const { execSync } = require('child_process')
const core = require('@actions/core')
const os = require('os')
const fs = require('fs')
const path = require('path')

const isTrue = str => str && (str.toLowerCase() === 'true' || str.toLowerCase() === 'yes' || str.toLowerCase() === '1')

try {

} catch (error) {
  core.setFailed(error)
}
