const downloadResolveRepo = ({
  fs,
  path,
  chalk,
  https,
  AdmZip,
  applicationName,
  resolveDownloadZipUrl,
  resolveCloneZipPath
}) =>
  new Promise((resolve, reject) => {
    // eslint-disable-next-line
    console.log(chalk.green('Load example'))
    try {
      fs.removeSync(resolveCloneZipPath)
    } catch (e) {}
    https.get(resolveDownloadZipUrl, response => {
      response.on('data', data => {
        fs.appendFileSync(resolveCloneZipPath, data)
      })

      response.on('end', () => {
        try {
          const zip = new AdmZip(resolveCloneZipPath)
          zip.extractAllTo(path.join(process.cwd(), applicationName), true)
          fs.unlinkSync(resolveCloneZipPath)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })
  })

export default downloadResolveRepo
