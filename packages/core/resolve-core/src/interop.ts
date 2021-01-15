import { AggregateMeta, ReadModelMeta } from './types'
import { SagaDomain, SagaInterop, SagaInteropMap } from './saga/types'
import {
  ReadModelDomain,
  ReadModelInterop,
  ReadModelInteropMap,
} from './read-model/types'
import {
  AggregateDomain,
  AggregateInterop,
  AggregateInteropMap,
} from './aggregate/types'
import { initSagaDomain } from './saga/saga'
import { initReadModelDomain } from './read-model/read-model'
import { initAggregateDomain } from './aggregate/aggregate'

export type Domain = {
  sagaDomain: SagaDomain
  readModelDomain: ReadModelDomain
  aggregateDomain: AggregateDomain
}

export type DomainMeta = {
  sagas: any[]
  readModels: ReadModelMeta[]
  aggregates: AggregateMeta[]
}

const initDomain = (domainMeta: DomainMeta): Domain => ({
  sagaDomain: initSagaDomain(domainMeta.sagas),
  readModelDomain: initReadModelDomain(domainMeta.readModels),
  aggregateDomain: initAggregateDomain(domainMeta.aggregates),
})

export {
  initDomain,
  ReadModelInterop,
  ReadModelInteropMap,
  SagaInterop,
  SagaInteropMap,
  AggregateInterop,
  AggregateInteropMap,
}
