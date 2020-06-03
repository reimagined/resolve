import { JSONWebTokenProvider } from './jwt-provider'
import { ViewModel } from './view-model-types'
import { CreateSubscribeAdapter } from './empty-subscribe-adapter'

export type Context = {
  origin?: string
  rootPath: string
  staticPath: string
  jwtProvider?: JSONWebTokenProvider
  viewModels: Array<ViewModel>
  subscribeAdapter?: CreateSubscribeAdapter
}
