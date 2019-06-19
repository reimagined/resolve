#!/usr/bin/env node

const path = require('path')
const { execSync } = require('child_process')

const {
  getCompileConfigs,
  getLocalRegistryConfig,
  safeName,
  patchPackageJson
} = require('@internal/helpers')

const localRegistry = getLocalRegistryConfig()
const configs = getCompileConfigs()

for (const { directory, name } of configs) {
  const rollback = patchPackageJson(directory)

  execSync(
    `yarn pack --filename="${path.join(
      localRegistry.directory,
      safeName(name)
    )}"`,
    {
      cwd: directory,
      stdio: 'inherit'
    }
  )

  rollback()
}
