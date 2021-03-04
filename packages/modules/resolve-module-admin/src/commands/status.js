import fetch from 'isomorphic-fetch'

export const handler = async ({ url, wait }) => {
  if (wait !== undefined && wait !== 'enabled' && wait !== 'disabled') {
    throw new Error(`Incorrect status = "${wait}"`)
  }
  let status = null

  for (;;) {
    try {
      const response = await fetch(`${url}/status`)
      await response.text()

      status = 'enabled'
    } catch (error) {
      if (error != null && error.code == 'ECONNREFUSED') {
        status = 'disabled'
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

export const command = 'status'
export const describe = 'get application status'
export const builder = (yargs) =>
  yargs.option('wait', {
    describe: 'expected status',
    type: 'string',
  })
