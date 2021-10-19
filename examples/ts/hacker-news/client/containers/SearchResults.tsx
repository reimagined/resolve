import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useReduxReadModel } from '@resolve-js/redux'
import { useSelector } from 'react-redux'
import { SearchResultItem } from '../components/SearchResultItem'

const NothingFound = styled.div`
  padding: 0 6px 6px 6px;
  color: gray;
  text-align: center;
`
type SearchResultsProps = {
  query: any
  onNavigate: () => any
}

type ResultItem = { type: string; aggregateId: string; text: string }

const SearchResults = ({ onNavigate, query }: SearchResultsProps) => {
  const { request: search, selector } = useReduxReadModel(
    {
      name: 'Search',
      resolver: 'find',
      args: {
        q: query,
      },
    },
    [],
    []
  )
  const { data: results } = useSelector(selector)

  useEffect(() => {
    search()
  }, [search])

  return results.length ? (
    results.map((item: ResultItem) => (
      <SearchResultItem data={item} onNavigate={onNavigate} />
    ))
  ) : (
    <NothingFound>Nothing found</NothingFound>
  )
}

export { SearchResults }
