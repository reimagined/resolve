import { RuntimeFactoryParameters } from '@resolve-js/runtime-base'

export const cleanUpProcess = async ({
  monitoring,
}: RuntimeFactoryParameters) => {
  await monitoring.publish({ source: 'processExit' })
  process.exit()
}
