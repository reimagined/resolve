import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { Pool } from 'resolve-encryption-base'
import { KeyStoreOptions } from './types'

const connect = async (
  pool: Pool<RDSDataService>,
  options: KeyStoreOptions
): Promise<RDSDataService> => {
  const { region } = options
  const rdsDataService = new RDSDataService({ region })
  return rdsDataService
}

export default connect
