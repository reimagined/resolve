import React from 'react'

import FilledItemsPager from './FilledItemsPager'

class ItemsPager extends React.Component {
  render() {
    return (
      <div>
        <FilledItemsPager
          limit={this.props.count}
          page={this.props.page}
          setPage={this.props.setPage}
        />
      </div>
    )
  }
}

export default ItemsPager
