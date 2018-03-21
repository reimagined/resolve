import React from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import { Helmet } from 'react-helmet'
import { connectReadModel } from 'resolve-redux'

const ITEMS_PER_PAGE = 10

const ItemsViewer = ({ items, page }) => (
  <ReactCSSTransitionGroup
    transitionName="example"
    transitionEnterTimeout={500}
    transitionLeaveTimeout={500}
  >
    <section key={`SC-${page}`}>
      {items && Array.isArray(items)
        ? items.map((item, idx) => (
            <article key={`LI-${page}-${idx}`}>
              <b>{+(ITEMS_PER_PAGE * page) + idx + 1}</b>: {item.name} ({
                item.rating
              }{' '}
              votes)
            </article>
          ))
        : 'No items found'}
    </section>
  </ReactCSSTransitionGroup>
)

const ItemsPager = ({ count, page, setPage }) => (
  <nav>
    {Array.from(
      new Array(Number.isInteger(count) && count > 0 ? +count : 0)
    ).map((_, idx) => (
      <button
        onClick={setPage.bind(null, idx)}
        disabled={idx === page}
        key={`BT${idx}`}
      >
        {`${+(ITEMS_PER_PAGE * idx) + 1} - ${ITEMS_PER_PAGE * (idx + 1)}`}
      </button>
    ))}
  </nav>
)

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName]
  } catch (err) {
    return null
  }
}

const FilledItemsViewer = connectReadModel((state, { page }) => ({
  readModelName: 'Rating',
  resolverName: 'TopRating',
  variables: { page, limit: ITEMS_PER_PAGE },
  isReactive: true,
  items: getReadModel(state, 'Rating', 'TopRating'),
  page
}))(ItemsViewer)

const FilledItemsPager = connectReadModel((state, { page, setPage }) => ({
  readModelName: 'Rating',
  resolverName: 'PagesCount',
  variables: { limit: ITEMS_PER_PAGE },
  isReactive: true,
  count: getReadModel(state, 'Rating', 'PagesCount'),
  page,
  setPage
}))(ItemsPager)

class Index extends React.Component {
  state = { page: 0 }
  setPage = page => this.setState({ page })

  render() {
    return (
      <div>
        <Helmet>
          <style>
            {`article {
                padding: 5px 10px;
                margin-bottom: 5px;
                background-color: #eeeeee;
                max-width: 350px;
                width: 350px;
              }
              article:nth-child(odd) {
                background-color: #dddddd;
              }
              nav {
                padding: 5px 10px;
                max-width: 350px;

              }
              .example-enter {
                position: absolute;
                opacity: 0.01;
              }
              .example-enter.example-enter-active {
                opacity: 1;
                transition: opacity 500ms ease-in;
              }
              .example-leave {
                opacity: 1;
              }
              .example-leave.example-leave-active {
                opacity: 0.01;
                transition: opacity 500ms ease-in;
              }`}
          </style>
        </Helmet>

        <FilledItemsViewer page={this.state.page} />

        <FilledItemsPager page={this.state.page} setPage={this.setPage} />
      </div>
    )
  }
}

export default [{ path: '/', component: Index }]
