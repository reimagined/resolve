import fetch from 'isomorphic-fetch'

export const handler = async ({ url, filePath }) => {
  const response = await fetch(
    `${url}/event-store/incremental-import?path=${encodeURI(filePath)}`
  )
  const result = await response.text()

  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'incremental-import <file-path>'
export const describe = 'incrementally import an event store to the cloud'
export const builder = (yargs) =>
  yargs.positional('file-path', {
    describe: 'path to a file containing events for incremental import',
    type: 'string',
  })
