import React from 'react'
import styled from 'styled-components'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
import SearchResultItem from '../components/SearchResultItem'

const NothingFound = styled.div`
  padding: 0 6px 6px 6px;
  color: gray;
  text-align: center;
`

const SearchResults = ({ results, onNavigate }) => {
  return results && results.length ? (
    results.map(item => (
      <SearchResultItem data={item} onNavigate={onNavigate} />
    ))
  ) : (
    <NothingFound>Nothing found</NothingFound>
  )
}

const mapStateToOptions = (state, { query }) => ({
  readModelName: 'Search',
  resolverName: 'find',
  resolverArgs: {
    q: query
  }
})

const mapStateToProps = (state, { data }) => ({
  results: data
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(SearchResults)
)
