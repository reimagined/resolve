import fsEx from 'fs-extra'
import childProcess from 'child_process'
import path from 'path'
import fetch from 'isomorphic-fetch'
import { getInstallations } from 'testcafe-browser-tools'

const buildDir = 'dist'
const readyUrl = 'query-is-ready'

const command = process.argv[2]

const cloudDevHost =
  process.env.RESOLVE_CLOUD_DEV_HOST || 'https://api.resolve-dev.ml/v0'
const cloudProdHost =
  process.env.RESOLVE_CLOUD_PROD_HOST || 'https://api.resolve.sh/v0'

const resolveDir = (dir: string): string => path.resolve(process.cwd(), dir)

const prepare = async () => {
  await fsEx.emptyDir(resolveDir(buildDir))
  await fsEx.copy(resolveDir('app'), resolveDir(buildDir))
  await fsEx.remove(resolveDir(`${buildDir}/node_modules`))
}

/*
const buildLocal = async () =>
  new Promise((resolve, reject) => {
    childProcess.spawn(
      'yarn dev',
      {
        cwd: resolveDir(buildDir)
      },
      (error, stdout) => {
        if (error) {
          reject(error)
        }
        resolve(stdout)
      }
    )
  })

*/

const runJest = async (options: { config: string }): Promise<any> => {
  const { config } = options
  return childProcess.execSync(
    [
      `jest`,
      `--config ${config}`
    ].join(' '),
    { stdio: 'inherit' }
  )
}

const runTestCafe = async (options: {
  testsDir: string
  browser: string
  customArgs: string[],
  timeout: number
}): Promise<any> => {
  let { testsDir, browser, customArgs, timeout } = options
  browser = browser != null ? browser : Object.keys(await getInstallations())[0]
  timeout = timeout != null ? timeout : 20000
  customArgs = customArgs != null ? customArgs : []

  try {
    return childProcess.execSync(
      [
        `testcafe ${browser}`,
        `${testsDir}`,
        `--app-init-delay ${timeout}`,
        `--selector-timeout ${timeout}`,
        `--assertion-timeout ${timeout}`,
        `--page-load-timeout ${timeout}`,
        browser === 'remote' ? ' --qr-code' : '',
        ...customArgs
      ].join(' '),
      { stdio: 'inherit' }
    )
  } catch (e) {
    throw ''
  }
}

const spawnLocal = async () => {
  const sp = childProcess.spawn('yarn', ['dev'], {
    cwd: resolveDir('app')
  })
  sp.stdout.on('data', data => {
    // eslint-disable-next-line no-console
    console.log(data.toString())
  })

  sp.stderr.on('data', data => {
    // eslint-disable-next-line no-console
    console.error(data.toString())
  })

  sp.on('close', code => {
    // eslint-disable-next-line no-console
    console.log(`child process exited with code ${code}`)
  })

  let error: any = null
  const url = `http://0.0.0.0:3000/api/${readyUrl}`
  while (true) {
    try {
      const response = await fetch(url)

      const result = await response.text()
      if (result !== 'ok') {
        error = [
          `${response.status}: ${response.statusText}`,
          `${result}`
        ].join('\n')
        // eslint-disable-next-line no-console
        console.log(error)
      }
      break
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return new Promise((resolve, reject) => {
    if (error) {
      sp.kill()
      reject(error)
    } else {
      resolve()
    }
  })
}

void (async () => {
  switch (command) {
    case 'local-api': {
      //await spawnLocal()
      await runJest({
        config: resolveDir('jest.config-api.js')
      })
      break
    }

    case 'local-testcafe': {
      await spawnLocal()

      break
    }

    case 'local-all': {
      //await buildLocal()
      break
    }

    case 'cloud-api': {
      await prepare()
      break
    }

    case 'cloud-testcafe': {
      await prepare()
      break
    }

    default: {
      throw new Error('Unknown target runtime')
    }
  }
})()
