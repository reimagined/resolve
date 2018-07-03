import React from 'react'
import { connectReadModel } from 'resolve-redux'

import FilledItemsViewer from './FilledItemsViewer'

class ItemsViewer extends React.Component {
  render() {
    return (
      <div>
        <FilledItemsViewer limit={this.props.count} page={this.props.page} />
      </div>
    )
  }
}

export default ItemsViewer
