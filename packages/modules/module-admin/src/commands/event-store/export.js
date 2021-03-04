import fetch from 'isomorphic-fetch'

export const handler = async ({ url, directory, maintenanceMode }) => {
  if (
    maintenanceMode !== undefined &&
    maintenanceMode !== 'auto' &&
    maintenanceMode !== 'manual'
  ) {
    throw new Error(`Incorrect maintenanceMode = ${maintenanceMode}`)
  }

  const response = await fetch(
    `${url}/event-store/export?directory=${encodeURI(directory)}${
      maintenanceMode == null ? '' : `&maintenanceMode=${maintenanceMode}`
    }`
  )
  const result = await response.text()

  //eslint-disable-next-line no-console
  console.log(result)
}

export const describe = 'export event-store from the directory'
export const command = 'export <directory>'
export const builder = (yargs) =>
  yargs
    .positional('directory', {
      describe: 'path to event-store backup directory',
      type: 'string',
    })
    .option('maintenance-mode', {
      describe: 'maintenance mode',
      type: 'string',
    })
