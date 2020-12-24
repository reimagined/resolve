import { initSagaDomain, SagaDomain } from './saga'

type Domain = {
  sagaDomain: SagaDomain
}

type DomainMeta = {
  sagas: any[]
}

const initDomain = (domainMeta: DomainMeta): Domain => ({
  sagaDomain: initSagaDomain(domainMeta.sagas),
})

export { initDomain }
