import { createContext } from 'react'
import { Context } from 'resolve-api'

export const ResolveContext = createContext<Context>({
  origin: '',
  rootPath: '',
  staticPath: '',
  viewModels: []
})
