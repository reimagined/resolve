import type {
  AggregateMeta,
  ReadModelMeta,
  ViewModelMeta,
  SagaMeta,
  CommandMiddleware,
  ReadModelProjectionMiddleware,
  ReadModelResolverMiddleware,
  ApiHandlerMeta,
} from './types/runtime'
import type { SagaDomain, SagaInterop, SagaInteropMap } from './saga/types'
import type {
  ReadModelDomain,
  ReadModelInterop,
  ReadModelInteropMap,
} from './read-model/types'
import type {
  AggregateDomain,
  AggregateInterop,
  AggregatesInterop,
} from './aggregate/types'
import type {
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

type Middlewares = {
  command: CommandMiddleware[]
  resolver: ReadModelResolverMiddleware[]
  projection: ReadModelProjectionMiddleware[]
}

export type DomainMeta = {
  sagas: SagaMeta[]
  readModels: ReadModelMeta[]
  aggregates: AggregateMeta[]
  viewModels: ViewModelMeta[]
  apiHandlers: ApiHandlerMeta[]
  middlewares?: Middlewares
}

const initDomain = (domainMeta: DomainMeta): Domain => ({
  sagaDomain: initSagaDomain(domainMeta.sagas),
  readModelDomain: initReadModelDomain(domainMeta.readModels),
  aggregateDomain: initAggregateDomain(domainMeta.aggregates),
  viewModelDomain: initViewModelDomain(domainMeta.viewModels),
})

export { initDomain }

export type {
  ReadModelInterop,
  ReadModelInteropMap,
  SagaInterop,
  SagaInteropMap,
  AggregateInterop,
  AggregatesInterop,
  ViewModelInterop,
  ViewModelInteropMap,
}
