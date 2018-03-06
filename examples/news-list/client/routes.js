import React from 'react'
import { connectReadModel } from 'resolve-redux'

const NewsViewer = ({ news }) =>
  news && Array.isArray(news) ? (
    <ul>
      {news.map((item, idx) => (
        <li key={`LI${idx}`}>
          <div>
            <span>{item.timestamp}</span>
            <span>{item.content}</span>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <span>No news found</span>
  )

const NewsPager = ({ count, page, setPreviousPage, setNextPage }) =>
  Number.isInteger(count) && count > 0 ? (
    <div>
      <button onClick={page > 0 ? setPreviousPage : () => null} disabled={!(page > 0)}>
        {`<<`}
      </button>
      <span>
        Page {page + 1} from {count}
      </span>
      <button onClick={page < count ? setNextPage : () => null} disabled={!(page < count - 1)}>
        {`>>`}
      </button>
    </div>
  ) : (
    <span />
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
  query: `query($page: Int) {
        LatestNews(page: $page) { id, timestamp, content }
      }`,
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
