import React from 'react'
import { Helmet } from 'react-helmet'
import { connectReadModel } from 'resolve-redux'
import PropTypes from 'prop-types'

import Header from '../components/Header.js'

const ITEMS_PER_PAGE = 10

class PageRoot extends React.Component {
  lastReadModels = []
  lastChildren = null
  showProgress = true
  unsubscribe = null
  afterAnimate = null

  handleChildChanges = () => {
    const state = this.context.store.getState()
    const actualReadModels = Object.keys(state.readModels).reduce(
      (acc, modelName) => [
        ...acc,
        ...Object.keys(state.readModels[modelName]).map(
          resolverName => `${modelName}:${resolverName}`
        )
      ],
      []
    )

    const insertedStates = new Set(
      actualReadModels.filter(x => !new Set(this.lastReadModels).has(x))
    )

    const removedStates = new Set(
      this.lastReadModels.filter(x => !new Set(actualReadModels).has(x))
    )

    if (removedStates.size > 0) {
      this.showProgress = true
      this.forceUpdate()
    } else if (insertedStates.size > 0) {
      this.showProgress = false
      this.forceUpdate()
    }

    this.lastReadModels = actualReadModels
  }

  componentWillMount() {
    this.unsubscribe = this.context.store.subscribe(this.handleChildChanges)

    this.afterAnimate =
      typeof window !== 'undefined'
        ? typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame.bind(window)
          : typeof window.setImmediate === 'function'
            ? window.setImmediate.bind(window)
            : window.setTimeout.bind(window, 0)
        : () => null
  }

  componentWillUnmount() {
    this.afterAnimate = null

    this.unsubscribe()
  }

  render() {
    return (
      <div key="loader">
        <div
          key="childcontent"
          style={this.showProgress ? { display: 'none' } : {}}
          ref={
            !this.showProgress
              ? ref => {
                  if (ref == null || this.showProgress) return
                  this.afterAnimate(() => {
                    this.lastChildren = ref.innerHTML
                  })
                }
              : ref => null // eslint-disable-line
          }
        >
          {this.props.children}
        </div>

        <div
          key="loadcontent"
          style={this.showProgress ? { opacity: 0.33 } : { display: 'none' }}
          {...(this.showProgress
            ? { dangerouslySetInnerHTML: { __html: this.lastChildren } }
            : {})}
        />
      </div>
    )
  }
}

PageRoot.contextTypes = {
  store: PropTypes.object.isRequired
}

const ItemsViewer = ({ items, page }) => (
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
)

const ItemsPager = ({ count, page, setPage }) => (
  <nav>
    {Array.from(
      new Array(Number.isInteger(count) && count > 0 ? +count : 0)
    ).map((_, idx) => (
      <button
        onClick={idx !== page ? setPage.bind(null, idx) : undefined}
        style={idx !== page ? {} : { fontWeight: 'bold' }}
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
  parameters: { page, limit: ITEMS_PER_PAGE },
  isReactive: true,
  items: getReadModel(state, 'Rating', 'TopRating'),
  page
}))(ItemsViewer)

const FilledItemsPager = connectReadModel((state, { page, setPage }) => ({
  readModelName: 'Rating',
  resolverName: 'PagesCount',
  parameters: { limit: ITEMS_PER_PAGE },
  isReactive: true,
  count: getReadModel(state, 'Rating', 'PagesCount'),
  page,
  setPage
}))(ItemsPager)

class App extends React.Component {
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
                max-width: 600px;
                width: 600px;
              }
              article:nth-child(odd) {
                background-color: #dddddd;
              }
              nav {
                padding: 5px 10px;
              }`}
          </style>
          <link rel="stylesheet" href="/bootstrap.min.css" />
          <title>reSolve Top List Example</title>
        </Helmet>

        <Header />

        <PageRoot>
          <FilledItemsViewer page={this.state.page} />
        </PageRoot>

        <FilledItemsPager page={this.state.page} setPage={this.setPage} />
      </div>
    )
  }
}

export default App
