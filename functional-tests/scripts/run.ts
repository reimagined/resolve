/* eslint-disable spellcheck/spell-checker */
import fs from 'fs'
import fsEx from 'fs-extra'
import path from 'path'
import os from 'os'
import { program } from 'commander'
import log from 'consola'

const verbosityLevels: { [key: string]: number } = {
  silent: -1,
  normal: 3,
  debug: 4,
  trace: 5,
}

const resolveDir = (dir: string): string => path.resolve(process.cwd(), dir)

const prepareCloudBundle = async () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-app-'))
  log.info(`preparing cloud app bundle in ${appDir}`)

  await fsEx.emptyDir(appDir)
  await fsEx.copy(resolveDir('app'), appDir)
  await fsEx.remove(path.resolve(appDir, 'node_modules'))

  return appDir
}

const deploy = async ({ url, publish }: { url: string, publish: boolean }) => {
  log.info(`#1: deploying test application to ${url}`)
  const appDir = await prepareCloudBundle()

  if (publish) {
    log.info(`publishing current repo to `)
  }
}

program.option('--verbosity <string>', 'verbosity level', 'debug')

program
  .command('deploy')
  .option(
    '-p, --publish <boolean>',
    'publish current packages to private repository',
    false
  )
  .option('-u, --url <string>', 'cloud endpoint url', 'https://api.resolve.sh')
  .action(deploy)

program.on('option:verbosity', () => {
  log.level = verbosityLevels[program.verbosity] || 3
})

program.parse(process.argv)
