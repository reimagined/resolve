import { getInstallations } from 'testcafe-browser-tools'
import { exec } from 'child_process'
import fetch from 'isomorphic-fetch'
import path from 'path'
import respawn from 'respawn'

const runTestcafe = async ({
  resolveConfig,
  functionalTestsDir,
  browser,
  timeout
}) => {
  const serverPath = path.resolve(__dirname, '../../dist/runtime/index.js')

  const server = respawn(
    [serverPath, `--distDir=${JSON.stringify(resolveConfig.distDir)}`],
    {
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit',
      fork: true
    }
  )

  process.on('exit', () => {
    server.stop()
  })

  server.start()

  while (true) {
    const statusUrl = `http://localhost:${resolveConfig.port}${
      resolveConfig.rootPath ? `/${resolveConfig.rootPath}` : ''
    }/api/status`
    try {
      const response = await fetch(statusUrl)
      if ((await response.text()) === 'ok') break
    } catch (e) {}
  }

  const stopServer = () => new Promise(resolve => server.stop(resolve))

  const targetBrowser =
    browser == null ? Object.keys(await getInstallations())[0] : browser
  const targetTimeout = timeout == null ? 20000 : timeout

  let stopTestcafe = async () => null

  await new Promise((resolve, reject) => {
    const testcafeProc = exec(
      `npx testcafe ${targetBrowser}` +
        ` ${functionalTestsDir}` +
        ` --app-init-delay ${targetTimeout}` +
        ` --selector-timeout ${targetTimeout}` +
        ` --assertion-timeout ${targetTimeout}` +
        ` --page-load-timeout ${targetTimeout}` +
        (targetBrowser === 'remote' ? ' --qr-code' : ''),
      { stdio: 'inherit' },
      error => (error ? resolve() : reject(error))
    )

    stopTestcafe = async => {
      testcafeProc.kill()
    }
  })

  return () => Promise.all([stopServer(), stopTestcafe()])
}

export default runTestcafe
