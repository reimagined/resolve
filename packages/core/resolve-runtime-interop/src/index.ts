import { SagaDomain, SagaInterop, SagaInteropMap } from './saga/types'
import { initSagaDomain } from './saga/saga'
import {
  ReadModelDomain,
  ReadModelInterop,
  ReadModelInteropMap,
} from './read-model/types'
import { initReadModelDomain } from './read-model/read-model'
import { ReadModelMeta } from './types'

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

export {
  initDomain,
  ReadModelInterop,
  ReadModelInteropMap,
  SagaInterop,
  SagaInteropMap,
}
