import fetch from 'isomorphic-fetch'

export const handler = async ({ url, waitReady }) => {
  let status = 'unknown'

  for (;;) {
    try {
      const response = await fetch(`${url}/system/status`)
      await response.text()

      status = 'ready'
    } catch (error) {
      if (error != null && error.code === 'ECONNREFUSED') {
        status = 'unknown'
      } else {
        throw error
      }
    }

    if (waitReady && status !== 'ready') {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } else {
      break
    }
  }

  // eslint-disable-next-line no-console
  console.log(status)
}

export const command = 'status'
export const describe = "get the system's status"
export const builder = (yargs) =>
  yargs.option('--wait-ready', {
    describe: 'wait for a system to initialize',
    type: 'boolean',
  })
