import fs from 'fs-extra'
import chalk from 'chalk'
import https from 'https'
import AdmZip from 'adm-zip'
import path from 'path'

import ProgressBar from 'progress'
import getLog from '@resolve-js/debug-levels'
import { resolveVersion } from './constants'
import safeName from './safe-name'

const log = getLog('resolve:create-resolve-app:download-resolve-repo')

const downloadResolveRepo = async (
  applicationPath: string,
  branch?: string,
  commit?: string
) => {
  const revision = branch ? branch : commit ? commit : `V${resolveVersion}`
  const resolveDownloadZipUrl = `https://codeload.github.com/reimagined/resolve/zip/${revision}`
  const resolveCloneZipPath = path.join(
    applicationPath,
    `resolve-${safeName(revision)}.zip`
  )

  try {
    await new Promise<void>((resolve, reject) => {
      try {
        if (fs.readdirSync(applicationPath).length !== 0) {
          reject(
            new Error(
              'Failed to create resolve application. Target directory is not empty.'
            )
          )
        }
      } catch (e) {}

      try {
        fs.ensureDirSync(applicationPath)
      } catch (e) {}

      const resolveCloneZip = fs.createWriteStream(resolveCloneZipPath)

      let error: any = null
      let downloadedBytes = 0

      resolveCloneZip.on('finish', function () {
        if (error) {
          log.debug('Clone failed')
          reject(error)
        } else {
          log.debug('Clone succeeded')
          resolve()
        }
      })

      https.get(resolveDownloadZipUrl, (response) => {
        let bar: any = null
        const showProgressBar = (total: number, increment: number) => {
          if (isNaN(+total)) {
            return
          }
          if (bar == null) {
            bar = new ProgressBar(
              `${chalk.green('Load example')} [:bar] :current/:total`,
              {
                width: 20,
                total: +total,
              }
            )

            bar.tick(downloadedBytes)
          }
          bar.tick(increment)
        }

        response.on('data', (data) => {
          const currentBytes = Buffer.byteLength(data)
          const total = response.headers['content-length'] ?? 0
          downloadedBytes += currentBytes
          showProgressBar(+total, currentBytes)

          resolveCloneZip.write(data)
        })
        response.on('end', () => {
          const total = response.headers['content-length'] ?? downloadedBytes
          showProgressBar(+total, 0)
          resolveCloneZip.end()
        })
        response.on('error', (err) => {
          error = err
          resolveCloneZip.end()
        })
      })
    })
  } catch (error) {
    if (
      error.message != null &&
      /Target directory is not empty/.test(error.message)
    ) {
      throw error
    }
    // eslint-disable-next-line no-console
    console.log(
      chalk.red('Referent commit does not exists in resolve repository.')
    )
    // eslint-disable-next-line no-console
    console.log(
      chalk.red('Maybe you forgot to merge your feature branch with dev branch')
    )
    log.debug('Repo downloading failed')
    // eslint-disable-next-line
    throw 'Repo downloading failed'
  }
  try {
    const zip = new AdmZip(resolveCloneZipPath)
    zip.extractAllTo(applicationPath, true)
    log.debug('Unzip succeeded')
  } catch (error) {
    log.debug('Unzip failed')
    throw error
  }

  fs.removeSync(resolveCloneZipPath)

  const [resolveRepoFolder] = fs.readdirSync(applicationPath)
  return path.join(applicationPath, resolveRepoFolder)
}

export default downloadResolveRepo
