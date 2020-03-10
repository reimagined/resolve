import { JSONWebTokenProvider } from './jwt_provider'
import { ViewModel } from './view_model_types'
import { CreateSubscribeAdapter } from './empty_subscribe_adapter'

export type Context = {
  origin?: string
  rootPath: string
  staticPath: string
  jwtProvider?: JSONWebTokenProvider
  viewModels: Array<ViewModel>
  subscribeAdapter?: CreateSubscribeAdapter
}
