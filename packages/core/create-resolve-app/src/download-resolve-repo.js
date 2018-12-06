const downloadResolveRepo = ({
  fs,
  chalk,
  https,
  console,
  AdmZip,
  applicationPath,
  resolveDownloadZipUrl,
  resolveCloneZipPath
}) => async () => {
  try {
    await new Promise((resolve, reject) => {
      console.log(chalk.green('Load example'))

      try {
        fs.removeSync(applicationPath)
      } catch (e) {}

      try {
        fs.ensureDirSync(applicationPath)
      } catch (e) {}

      const resolveCloneZip = fs.createWriteStream(resolveCloneZipPath)

      let error = null

      resolveCloneZip.on('finish', function() {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })

      https.get(resolveDownloadZipUrl, response => {
        response.on('data', data => {
          resolveCloneZip.write(data)
        })
        response.on('end', () => {
          resolveCloneZip.end()
        })
        response.on('error', err => {
          error = err
          resolveCloneZip.end()
        })
      })
    })
  } catch (_) {
    console.log(
      chalk.red('Referent commit does not exists in resolve repository.')
    )
    console.log(
      chalk.red('Maybe you forgot to merge your feature branch with dev branch')
    )
    // eslint-disable-next-line
    throw 'Repo downloading failed'
  }

  const zip = new AdmZip(resolveCloneZipPath)
  zip.extractAllTo(applicationPath, true)

  fs.removeSync(resolveCloneZipPath)
}

export default downloadResolveRepo
