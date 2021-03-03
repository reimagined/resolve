import ProgressBar from 'progress'
import getLog from '@resolve-js/debug-levels'

const log = getLog('resolve:create-resolve-app:download-resolve-repo')

const downloadResolveRepo = (pool) => async () => {
  const {
    fs,
    chalk,
    https,
    console,
    AdmZip,
    applicationPath,
    resolveDownloadZipUrl,
    resolveCloneZipPath,
    path,
  } = pool
  try {
    await new Promise((resolve, reject) => {
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

      let error = null
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
        let bar = null
        const showProgressBar = (total, increment) => {
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
          const total = response.headers['content-length']
          downloadedBytes += currentBytes
          showProgressBar(total, currentBytes)

          resolveCloneZip.write(data)
        })
        response.on('end', () => {
          const total = response.headers['content-length'] ?? downloadedBytes
          showProgressBar(total, 0)

          const contentDisposition = String(
            response.headers['content-disposition']
          )
          const fileNameLength = 'filename='.length
          const zipExtLength = '.zip'.length
          const fileNameIndex =
            contentDisposition.indexOf('filename=') + fileNameLength
          if (fileNameIndex > fileNameLength) {
            const resolveDirName = contentDisposition.substring(
              fileNameIndex,
              contentDisposition.length - zipExtLength
            )

            pool.resolveClonePath = path.join(
              pool.applicationPath,
              resolveDirName
            )
            pool.resolveCloneExamplesPath = path.join(
              pool.resolveClonePath,
              'examples'
            )
            pool.resolveCloneExamplePath = path.join(
              pool.resolveCloneExamplesPath,
              pool.exampleName
            )
          }

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
    console.log(
      chalk.red('Referent commit does not exists in resolve repository.')
    )
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
}

export default downloadResolveRepo
