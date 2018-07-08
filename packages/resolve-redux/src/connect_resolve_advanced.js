import React from 'react'
import { Consumer } from './resolve_context'

import * as actions from './actions'

const connectResolveAdvanced = Component => {
  return class ConnectResolveAdvanced extends React.PureComponent {
    functionAsChildComponent = context => (
      <Component {...context} actions={actions} {...this.props} />
    )

    render() {
      return <Consumer>{this.functionAsChildComponent}</Consumer>
    }
  }

  return ConnectResolveAdvanced
}

export default connectResolveAdvanced
