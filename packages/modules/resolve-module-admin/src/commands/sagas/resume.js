import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/resume?listenerId=${args.saga}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {}
}

export const command = 'resume <saga>'
export const describe = 'resume saga updates'
export const builder = yargs =>
  yargs.positional('saga', {
    describe: 'an existing saga`s name',
    type: 'string'
  })
