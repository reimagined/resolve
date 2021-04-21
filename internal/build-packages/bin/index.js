#!/usr/bin/env node

const path = require('path')
const { execSync } = require('child_process')

const {
  getCompileConfigs,
  getLocalRegistryConfig,
  safeName,
  patchPackageJson,
  getResolveDir,
} = require('@internal/helpers')

const localRegistry = getLocalRegistryConfig()
const configs = getCompileConfigs()

for (const { location, name } of configs) {
  const directory = path.resolve(getResolveDir(), location)
  const rollback = patchPackageJson()

  execSync(
    `yarn pack --filename="${path.join(
      localRegistry.directory,
      safeName(name)
    )}"`,
    {
      cwd: directory,
      stdio: 'inherit',
    }
  )

  rollback()
}
