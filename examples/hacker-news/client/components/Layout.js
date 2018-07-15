import React from 'react'
import { connectStaticBasedUrls } from 'resolve-redux'
import { Link as NormalLink } from 'react-router-dom'
import styled from 'styled-components'

import Splitter from './Splitter'
import Header from '../containers/Header'
import NavLink from '../containers/Link'
import LoginInfo from '../containers/LoginInfo'
import PagePreloader from '../containers/PagePreloader'

const ContentRoot = styled.div`
  width: 90%;
  max-width: 1280px;
  margin: 8px auto;
  color: #000;
  background-color: #f5f5f5;
  font-size: 10pt;
  font-family: Verdana, Geneva, sans-serif;

  @media only screen and (max-width: 750px) and (min-width: 300px) {
    width: 100%;
    margin: 0px auto;
  }
`

const PageHeader = styled.div`
  color: #fff;
  background-color: #3949ab;
  padding: 6px;
  line-height: 18px;
  vertical-align: middle;
  position: relative;
`

const Link = styled(NavLink)`
  color: white;

  &.active {
    font-weight: bold;
    text-decoration: underline;
  }
`

const PageTitle = styled.div`
  display: inline-block;
  font-weight: bold;
  color: #fff;
  margin-left: 0.25em;
  margin-right: 0.75em;

  @media only screen and (max-width: 750px) and (min-width: 300px) {
    display: none;
  }
`

const Content = styled.div`
  overflow-wrap: break-word;
  word-wrap: break-word;
`

const Footer = styled.div`
  margin-top: 1em;
  border-top: 1px solid #e7e7e7;
  text-align: center;
  padding: 6px 0;
`

const FooterLink = styled.a`
  color: #333;
  text-decoration: underline;
`

const StaticBasedImg = connectStaticBasedUrls(['src'])('img')

const Layout = ({ children }) => (
  <div>
    <Header
      title="reSolve Hacker News"
      favicon="/favicon.ico"
      css={['/style.css']}
    />
    <PagePreloader />
    <ContentRoot>
      <PageHeader>
        <Link to="/">
          <StaticBasedImg
            src="/reSolve-logo.svg"
            width="18"
            height="18"
            alt=""
          />
        </Link>
        <Link to="/newest">
          <PageTitle>reSolve HN</PageTitle>
        </Link>{' '}
        <Link to="/newest">new</Link>
        <Splitter color="white" />
        <Link to="/comments">comments</Link>
        <Splitter color="white" />
        <Link to="/show">show</Link>
        <Splitter color="white" />
        <Link to="/ask">ask</Link>
        <Splitter color="white" />
        <NormalLink to="/submit">submit</NormalLink>
        <LoginInfo />
      </PageHeader>
      <Content>{children}</Content>
      <Footer>
        <FooterLink href="https://github.com/reimagined/resolve">
          reimagined/resolve
        </FooterLink>
      </Footer>
    </ContentRoot>
  </div>
)

export default Layout
