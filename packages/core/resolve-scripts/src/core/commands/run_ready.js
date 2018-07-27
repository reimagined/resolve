import { execSync } from 'child_process'

webpack({
  mode: 'test',
  build: true,
  start: true,
  watch: false,
  openBrowser: false
})
  .then(async ({ resolveConfig }) => {
    const statusUrl = `http://localhost:${resolveConfig.port}${
      resolveConfig.rootPath ? `/${resolveConfig.rootPath}` : ''
    }/api/status`

    while (true) {
      const waitPromise = new Promise(resolve => setTimeout(resolve, 500))
      try {
        const response = await fetch(statusUrl)
        if ((await response.text()) === 'ok') {
          break
        }
      } catch (e) {}

      await waitPromise
    }

    execSync(process.argv.slice(2).join(' '), { stdio: 'inherit' })
  })
  .catch(error => {
    console.log(error)
  })
