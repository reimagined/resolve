import React from 'react'
import PropTypes from 'prop-types'
import { NavLink } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'

import Splitter from '../components/Splitter'
import LoginInfo from './LoginInfo'
import { rootDirectory } from '../constants'

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

class PageRoot extends React.Component {
  lastReadModels = []
  lastChildren = null
  showProgress = true
  unsubscribe = null
  afterAnimate = null

  handleChildChanges = () => {
    const state = this.context.store.getState()
    const actualReadModels = Object.keys(state.readModels).reduce(
      (acc, modelName) => [
        ...acc,
        ...Object.keys(state.readModels[modelName]).map(
          resolverName => `${modelName}:${resolverName}`
        )
      ],
      []
    )

    const insertedStates = new Set(
      actualReadModels.filter(x => !new Set(this.lastReadModels).has(x))
    )

    const removedStates = new Set(
      this.lastReadModels.filter(x => !new Set(actualReadModels).has(x))
    )

    if (removedStates.size > 0) {
      this.showProgress = true
      this.forceUpdate()
    } else if (insertedStates.size > 0) {
      this.showProgress = false
      this.forceUpdate()
    }

    this.lastReadModels = actualReadModels
  }

  componentWillMount() {
    this.unsubscribe = this.context.store.subscribe(this.handleChildChanges)

    this.afterAnimate =
      typeof window !== 'undefined'
        ? typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame.bind(window)
          : typeof window.setImmediate === 'function'
            ? window.setImmediate.bind(window)
            : window.setTimeout.bind(window, 0)
        : () => null
  }

  componentWillUnmount() {
    this.afterAnimate = null

    this.unsubscribe()
  }

  render() {
    return (
      <div key="loader">
        <div
          key="childcontent"
          style={this.showProgress ? { display: 'none' } : {}}
          ref={
            !this.showProgress
              ? ref => {
                  if (ref == null || this.showProgress) return
                  this.afterAnimate(() => {
                    this.lastChildren = ref.innerHTML
                  })
                }
              : ref => null
          }
        >
          {this.props.children}
        </div>

        <div
          key="loadcontent"
          style={this.showProgress ? { opacity: 0.33 } : { display: 'none' }}
          {...(this.showProgress
            ? { dangerouslySetInnerHTML: { __html: this.lastChildren } }
            : {})}
        />
      </div>
    )
  }
}

PageRoot.contextTypes = {
  store: PropTypes.object.isRequired
}

const Layout = ({ children }) => (
  <div>
    <Helmet>
      <title>reSolve Hacker News</title>
      <meta
        name="viewport"
        content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <link
        rel="shortcut icon"
        type="image/x-icon"
        href={`${rootDirectory}/static/reSolve-logo.svg`}
      />
      <link
        rel="stylesheet"
        type="text/css"
        href={`${rootDirectory}/static/style.css`}
      />
    </Helmet>
    <ContentRoot>
      <PageHeader>
        <Link to="/">
          <img
            src={`${rootDirectory}/static/reSolve-logo.svg`}
            width="18"
            height="18"
            alt=""
          />
        </Link>
        <Link to="/">
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
        <Link to="/submit">submit</Link>
        <LoginInfo />
      </PageHeader>
      <Content>
        <PageRoot>{children}</PageRoot>
      </Content>
      <Footer>
        <FooterLink href="https://github.com/reimagined/resolve">
          reimagined/resolve
        </FooterLink>
      </Footer>
    </ContentRoot>
  </div>
)

export default Layout
