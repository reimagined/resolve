import React from 'react'
import { Helmet } from 'react-helmet'

import ItemsPager from './ItemsPager'
import ItemsViewer from './ItemsViewer'

const ITEMS_PER_PAGE = 10

class App extends React.Component {
  state = { page: 0 }
  setPage = page => this.setState({ page })

  render() {
    return (
      <div className="example-wrapper">
        <h2 className="example-title">Team's Rating Top 100</h2>

        <ItemsViewer limit={ITEMS_PER_PAGE} page={this.state.page} />

        <ItemsPager
          limit={ITEMS_PER_PAGE}
          page={this.state.page}
          setPage={this.setPage}
        />
      </div>
    )
  }
}

export default App
