import React from 'react'
import { connectReadModel } from 'resolve-redux'

const NewsViewer = ({ news }) =>
  news && news.constructor === Object ? (
    <ul>{news.map(item => <li>${item}</li>)}</ul>
  ) : (
    <span>No news found</span>
  )

const NewsPager = ({ count, page, setPreviousPage, setNextPage }) =>
  Number.isInteger(count) ? (
    <div>
      <button onClick={page > 0 ? setPreviousPage : () => null} disabled={!!(page > 0)} />
      <span>
        Page ${page + 1} from ${count}
      </span>
      <button onClick={page < count ? setNextPage : () => null} disabled={!!(page < count)} />
    </div>
  ) : (
    <span />
  )

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName]
  } catch (err) {
    return null
  }
}

const getFilledNewsViewer = page =>
  connectReadModel(state => ({
    readModelName: 'News',
    resolverName: 'LatestNews',
    query: `query($page: Int) {
        LatestNews(page: $page) { id, timestamp, content }
      }`,
    variables: { page },
    isReactive: true,
    news: getReadModel(state, 'News', 'LatestNews')
  }))(NewsViewer)

const getFilledNewsPager = (page, setPreviousPage, setNextPage) =>
  connectReadModel(state => ({
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
    const FilledNewsViewer = getFilledNewsViewer(this.state.page)
    const FilledNewsPager = getFilledNewsPager(
      this.state.page,
      this.setPreviousPage,
      this.setNextPage
    )

    return (
      <div>
        <FilledNewsViewer />
        <FilledNewsPager />
      </div>
    )
  }
}

export default [{ path: '/', component: Index }]
