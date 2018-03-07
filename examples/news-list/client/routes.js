import React from 'react'
import { Helmet } from 'react-helmet'
import { connectReadModel } from 'resolve-redux'

const NewsViewer = ({ news }) =>
  news && Array.isArray(news) ? (
    <section>{news.map((item, idx) => <article key={`LI${idx}`}>{item.content}</article>)}</section>
  ) : (
    <section>No news found</section>
  )

const NewsPager = ({ count, page, setPreviousPage, setNextPage }) =>
  Number.isInteger(count) && count > 0 ? (
    <nav>
      <button onClick={page > 0 ? setPreviousPage : () => null} disabled={!(page > 0)}>
        {`<<`}
      </button>
      <span>
        Page {page + 1} from {count}
      </span>
      <button onClick={page < count ? setNextPage : () => null} disabled={!(page < count - 1)}>
        {`>>`}
      </button>
    </nav>
  ) : (
    <nav />
  )

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName][resolverName]
  } catch (err) {
    return null
  }
}

const FilledNewsViewer = connectReadModel((state, { page }) => ({
  readModelName: 'News',
  resolverName: 'LatestNews',
  query: `query($page: Int) { LatestNews(page: $page) { id, timestamp, content } }`,
  variables: { page },
  isReactive: true,
  news: getReadModel(state, 'News', 'LatestNews')
}))(NewsViewer)

const FilledNewsPager = connectReadModel((state, { page, setPreviousPage, setNextPage }) => ({
  readModelName: 'News',
  resolverName: 'PagesCount',
  query: `query { PagesCount }`,
  variables: {},
  isReactive: true,
  count: getReadModel(state, 'News', 'PagesCount'),
  page,
  setPreviousPage,
  setNextPage
}))(NewsPager)

class Index extends React.Component {
  state = { page: 0 }
  setPreviousPage = () => this.setState({ page: this.state.page - 1 })
  setNextPage = () => this.setState({ page: this.state.page + 1 })

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
              }`}
          </style>
        </Helmet>
        <FilledNewsViewer page={this.state.page} />
        <FilledNewsPager
          page={this.state.page}
          setPreviousPage={this.setPreviousPage}
          setNextPage={this.setNextPage}
        />
      </div>
    )
  }
}

export default [{ path: '/', component: Index }]
