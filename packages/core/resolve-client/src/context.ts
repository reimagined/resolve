import { JSONWebTokenProvider } from './jwt-provider'
import { ViewModel } from './types'

export type Context = {
  origin?: string
  rootPath: string
  staticPath: string
  jwtProvider?: JSONWebTokenProvider
  viewModels: Array<ViewModel>
  fetch?: Function
}
