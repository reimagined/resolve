import React from 'react'
import { Store } from 'redux'
import { Provider as ReduxProvider } from 'react-redux'
import { ResolveProvider, ResolveProviderProps } from '@resolve-js/react-hooks'

type ResolveReduxProviderProps = {
  store: Store
} & ResolveProviderProps

const ResolveReduxProvider: React.FunctionComponent<ResolveReduxProviderProps> = ({
  children,
  context,
  store,
}) => {
  return (
    <ResolveProvider context={context}>
      <ReduxProvider store={store}>{children}</ReduxProvider>
    </ResolveProvider>
  )
}

export { ResolveReduxProvider }
