import React from 'react'
import styled from 'styled-components'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
import SearchResults from './SearchResults'

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
`
const SearchResultsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  color: black;
  background: white;
  width: 300px;
  max-height: 300px;
`

export class Search extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = { query: '' }

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    this.setState({ query: event.target.value })
  }

  render() {
    const { query } = this.state
    const { enabled } = this.props

    return (
      <SearchResultsWrapper>
        <SearchField
          type="text"
          placeholder="search"
          disabled={!enabled}
          value={this.state.query}
          onChange={this.handleChange}
        />

        {query.length ? (
          <SearchResultsContainer>
            <SearchResultsTitle>
              Search results for <strong>{query}</strong>:
            </SearchResultsTitle>
            <SearchResults
              query={query}
              onNavigate={() => {
                this.setState({ query: '' })
              }}
            />
          </SearchResultsContainer>
        ) : null}
      </SearchResultsWrapper>
    )
  }
}

const mapStateToOptions = () => ({
  readModelName: 'Search',
  resolverName: 'enabled',
  resolverArgs: {}
})

const mapStateToProps = (state, { data }) => ({
  enabled: data
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(Search)
)
