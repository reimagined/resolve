import React, { useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useReduxReadModel } from '@resolve-js/redux'
import { useSelector } from 'react-redux'
import { SearchResults } from './SearchResults'
import { Splitter } from '../components/Splitter'
const SearchField = styled.input`
  width: 100px !important;
`
const SearchResultsTitle = styled.div`
  color: gray;
  padding: 6px;
`
const SearchResultsWrapper = styled.div`
  position: relative;
  display: inline-block;
  float: right;
`
const SearchResultsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: -194px;
  right: 0;
  color: black;
  background: white;
  width: 300px;
  max-height: 500px;
  overflow-y: scroll;
`
const Search = () => {
  const [query, setQuery] = useState('')
  const { request: requestSearchAvailability, selector } = useReduxReadModel(
    {
      name: 'Search',
      resolver: 'enabled',
      args: {},
    },
    false,
    []
  )
  const { data: enabled } = useSelector(selector)
  const handleChange = useCallback(
    (event) => {
      setQuery(event.target.value)
    },
    [setQuery]
  )
  useEffect(() => {
    requestSearchAvailability()
  }, [requestSearchAvailability])
  return (
    <SearchResultsWrapper>
      <SearchField
        type="text"
        placeholder="search"
        disabled={!enabled}
        value={query}
        onChange={handleChange}
      />

      {query.length ? (
        <SearchResultsContainer>
          <SearchResultsTitle>
            Search results for <strong>{query}</strong>:
          </SearchResultsTitle>
          <SearchResults query={query} onNavigate={() => setQuery('')} />
        </SearchResultsContainer>
      ) : null}
      <Splitter color="white" />
    </SearchResultsWrapper>
  )
}
export { Search }
