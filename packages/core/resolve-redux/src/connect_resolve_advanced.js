import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'

import { Consumer } from './resolve_context'
import * as actions from './actions'

const connectResolveAdvanced = Component => {
  class ConnectResolveAdvanced extends React.PureComponent {
    functionAsChildComponent = context => (
      <Component {...context} actions={actions} {...this.props} />
    )

    render() {
      return <Consumer>{this.functionAsChildComponent}</Consumer>
    }
  }

  hoistNonReactStatic(ConnectResolveAdvanced, Component)

  return ConnectResolveAdvanced
}

export default connectResolveAdvanced
