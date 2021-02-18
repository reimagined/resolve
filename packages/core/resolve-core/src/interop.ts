import { AggregateMeta, ReadModelMeta, ViewModelMeta } from './types/runtime'
import { SagaDomain, SagaInterop, SagaInteropMap } from './saga/types'
import {
  ReadModelDomain,
  ReadModelInterop,
  ReadModelInteropMap,
} from './read-model/types'
import {
  AggregateDomain,
  AggregateInterop,
  AggregatesInterop,
} from './aggregate/types'
import {
  ViewModelDomain,
  ViewModelInterop,
  ViewModelInteropMap,
} from './view-model/types'
import { initSagaDomain } from './saga/saga'
import { initReadModelDomain } from './read-model/read-model'
import { initAggregateDomain } from './aggregate/aggregate'
import { initViewModelDomain } from './view-model/view-model'

export type Domain = {
  sagaDomain: SagaDomain
  readModelDomain: ReadModelDomain
  aggregateDomain: AggregateDomain
  viewModelDomain: ViewModelDomain
}

export type DomainMeta = {
  sagas: any[]
  readModels: ReadModelMeta[]
  aggregates: AggregateMeta[]
  viewModels: ViewModelMeta[]
}

const initDomain = (domainMeta: DomainMeta): Domain => ({
  sagaDomain: initSagaDomain(domainMeta.sagas),
  readModelDomain: initReadModelDomain(domainMeta.readModels),
  aggregateDomain: initAggregateDomain(domainMeta.aggregates),
  viewModelDomain: initViewModelDomain(domainMeta.viewModels),
})

export {
  initDomain,
  ReadModelInterop,
  ReadModelInteropMap,
  SagaInterop,
  SagaInteropMap,
  AggregateInterop,
  AggregatesInterop,
  ViewModelInterop,
  ViewModelInteropMap,
}
