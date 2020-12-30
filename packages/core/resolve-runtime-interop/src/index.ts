import { SagaDomain } from './saga/types'
import { initSagaDomain } from './saga/saga'
import {
  ReadModelDomain,
  ReadModelMeta,
  ReadModelInterop,
  ReadModelInteropMap,
} from './read-model/types'
import { initReadModelDomain } from './read-model/read-model'

export type Domain = {
  sagaDomain: SagaDomain
  readModelDomain: ReadModelDomain
}

export type DomainMeta = {
  sagas: any[]
  readModels: ReadModelMeta[]
}

const initDomain = (domainMeta: DomainMeta): Domain => ({
  sagaDomain: initSagaDomain(domainMeta.sagas),
  readModelDomain: initReadModelDomain(domainMeta.readModels),
})

export { initDomain, ReadModelInterop, ReadModelInteropMap }
