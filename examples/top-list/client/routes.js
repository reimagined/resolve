import React from 'react'
import { Helmet } from 'react-helmet'
import { connectReadModel } from 'resolve-redux'

const ITEMS_PER_PAGE = 10

const ItemsViewer = ({ items, page }) =>
  items && Array.isArray(items) ? (
    <section>
      {items.map((item, idx) => (
        <article key={`LI${idx}`}>
          <b>{+(ITEMS_PER_PAGE * idx) + 1}</b>: {item.content}
        </article>
      ))}
    </section>
  ) : (
    <section>No items found</section>
  )

const ItemsPager = ({ count, page, setPage }) => (
  <nav>
    {Array.from(new Array(Number.isInteger(count) && count > 0 ? +count : 0)).map((_, idx) => (
      <button onClick={setPage.bind(null, idx)} disabled={idx === page}>
        {`${+(ITEMS_PER_PAGE * idx) + 1} - ${(ITEMS_PER_PAGE + 1) * idx}`}
      </button>
    ))}
  </nav>
)

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName][resolverName]
  } catch (err) {
    return null
  }
}

const FilledItemsViewer = connectReadModel((state, { page }) => ({
  readModelName: 'Rating',
  resolverName: 'TopRating',
  query: `query($page: Int) { TopRating(page: $page) { id, rating, name } }`,
  variables: { page, limit: ITEMS_PER_PAGE },
  isReactive: true,
  items: getReadModel(state, 'Rating', 'TopRating'),
  page
}))(ItemsViewer)

const FilledItemsPager = connectReadModel((state, { page, setPage }) => ({
  readModelName: 'Rating',
  resolverName: 'PagesCount',
  query: `query { PagesCount }`,
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
              }
              article:nth-child(odd) {
                background-color: #dddddd;
              }
              nav {
                padding: 5px 10px;
                max-width: 350px;
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
