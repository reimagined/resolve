import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'

import { Consumer } from './resolve_context'
import * as actions from './actions'

const connectResolveAdvanced = (Component: any): any => {
  class ConnectResolveAdvancedComponent extends React.PureComponent<any> {
    functionAsChildComponent = (context: any) => (
      <Component {...context} actions={actions} {...this.props} />
    )

    render() {
      return <Consumer>{this.functionAsChildComponent}</Consumer>
    }
  }

  hoistNonReactStatic(ConnectResolveAdvancedComponent, Component)

  return ConnectResolveAdvancedComponent
}

export default connectResolveAdvanced
