import fetch from 'isomorphic-fetch'

import checkMaintenanceMode from '../../utils/checkMaintenanceMode'

export const handler = async ({ url, directory, maintenanceMode }) => {
  checkMaintenanceMode(maintenanceMode)

  const response = await fetch(
    `${url}/event-store/import?directory=${encodeURI(directory)}${
      maintenanceMode == null ? '' : `&maintenanceMode=${maintenanceMode}`
    }`
  )
  const result = await response.text()

  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'import <directory>'
export const describe = 'import an event store to the specified directory'
export const builder = (yargs) =>
  yargs
    .positional('directory', {
      describe: 'path to event store backup directory',
      type: 'string',
    })
    .option('maintenance-mode', {
      describe: 'maintenance mode',
      type: 'string',
    })
