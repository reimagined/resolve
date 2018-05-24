import React from 'react';
import { Helmet } from 'react-helmet';

import Header from '../components/Header.js';
import ItemsViewer from '../containers/ItemsViewer.js';
import ItemsPager from '../containers/ItemsPager.js';

const ITEMS_PER_PAGE = 10;

class App extends React.Component {
  state = { page: 0 };
  setPage = page => this.setState({ page });

  render() {
    return (
      <div>
        <Helmet>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link rel="stylesheet" href="/bootstrap.min.css" />
          <link rel="stylesheet" href="/style.css" />
          <title>reSolve Top List Example</title>
        </Helmet>

        <Header />

        <div className="example-wrapper">
          <h2 className="example-titul">Team's Rating Top 100</h2>

          <ItemsViewer count={ITEMS_PER_PAGE} page={this.state.page} />

          <ItemsPager
            count={ITEMS_PER_PAGE}
            page={this.state.page}
            setPage={this.setPage}
          />
        </div>
      </div>
    );
  }
}

export default App;
