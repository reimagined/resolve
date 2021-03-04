import fetch from 'isomorphic-fetch'

export const handler = async ({ url, waitReady }) => {
  const wait = waitReady ? 'ready' : 'unknown'
  let status = null

  for (;;) {
    try {
      const response = await fetch(`${url}/system-status`)
      await response.text()

      status = 'ready'
    } catch (error) {
      if (error != null && error.code == 'ECONNREFUSED') {
        status = 'unknown'
      } else {
        throw error
      }
    }

    if (wait != null && status !== wait) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } else {
      break
    }
  }

  // eslint-disable-next-line no-console
  console.log(status)
}

export const command = 'system-status'
export const describe = 'get the system status'
export const builder = (yargs) =>
  yargs.option('--wait-ready', {
    describe: 'wait for the system to initialize',
    type: 'boolean',
  })
