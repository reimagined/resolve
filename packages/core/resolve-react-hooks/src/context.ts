import { createContext } from 'react'
import { Context } from 'resolve-client'

export const ResolveContext = createContext<Context>({
  origin: '',
  rootPath: '',
  staticPath: '',
  viewModels: []
})
