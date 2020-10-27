import React from 'react'
import { Store } from 'redux'
import { Provider as ReduxProvider } from 'react-redux'
import { Context } from 'resolve-client'
import { ResolveContext } from 'resolve-react-hooks'

type ResolveReduxProviderProps = {
  resolveContext: Context
  store: Store
}

const ResolveReduxProvider: React.FunctionComponent<ResolveReduxProviderProps> = ({
  children,
  resolveContext,
  store,
}) => {
  return (
    <ResolveContext.Provider value={resolveContext}>
      <ReduxProvider store={store}>{children}</ReduxProvider>
    </ResolveContext.Provider>
  )
}

export { ResolveReduxProvider }
