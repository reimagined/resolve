import React from 'react'
import styled from 'styled-components'
import Filters from './Filters'
import AddTodo from '../containers/AddTodo'
import VisibleTodoList from '../containers/VisibleTodoList'

const PageContent = styled.div`
  background-color: #f1f1f1;
  width: 300px;
  margin: 0 auto;
  font-size: 10pt;
  font-family: Verdana, Geneva, sans-serif;
`

const PageHeader = styled.div`
  color: #fff;
  background-color: #3949ab;
  display: flex;
  align-items: center;
  padding: 8px;
`

const PageTitle = styled.div`
  text-align: center;
  font-weight: bold;
  flex-basis: 100%;
`

const PageFooter = styled.div`
  background-color: #ddd;
  text-align: center;
  padding: 6px;
`

const FooterLink = styled.a`
  color: #777;
  text-decoration: underline;
`

const App = () => (
  <PageContent>
    <PageHeader>
      <img src="/static/reSolve-logo.svg" width="18" height="18" alt="" />
      <PageTitle>Resolve TodoList</PageTitle>
    </PageHeader>
    <AddTodo />
    <VisibleTodoList />
    <Filters />
    <PageFooter>
      <FooterLink href="https://github.com/reimagined/resolve" target="_blank">
        reimagined/resolve
      </FooterLink>
    </PageFooter>
  </PageContent>
)

export default App
