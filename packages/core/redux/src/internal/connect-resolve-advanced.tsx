import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'

import * as internalActions from './actions'
import * as commandActions from '../command/actions'
import * as readModelActions from '../read-model/actions'
import * as viewModelActions from '../view-model/actions'

const allActions = {
  ...internalActions,
  ...commandActions,
  ...readModelActions,
  ...viewModelActions,
}

const connectResolveAdvanced = (Component: any): any => {
  class ConnectResolveAdvancedComponent extends React.PureComponent<any> {
    render() {
      return <Component actions={allActions} {...this.props} />
    }
  }

  hoistNonReactStatic(ConnectResolveAdvancedComponent, Component)

  return ConnectResolveAdvancedComponent
}

export default connectResolveAdvanced
