import React from 'react'
import { Context } from '@resolve-js/client'
import { ResolveContext } from './context'

export type ResolveProviderProps = {
  context: Context
}

const ResolveProvider: React.FunctionComponent<ResolveProviderProps> = ({
  children,
  context,
}) => (
  <ResolveContext.Provider value={context}>{children}</ResolveContext.Provider>
)

export { ResolveProvider }
