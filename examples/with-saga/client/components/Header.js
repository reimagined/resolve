import React from 'react'

const Header = () => (
  <div>
    <nav className="navbar navbar-light bg-light">
      <div className="container">
        <p className="navbar-text mb-0">
          <img className="mr-1" src="/resolve-logo.png" />
          Saga example
        </p>

        <div className="navbar-nav flex-row">
          <p className="navbar-text navbar-right mb-0">
            <a className="navbar-link" href="https://facebook.com/resolvejs/">
              <img className="mr-1" src="/fb-logo.png" />
            </a>
          </p>

          <p className="navbar-text navbar-right mb-0">
            <a className="navbar-link" href="https://twitter.com/resolvejs">
              <img className="mr-1" src="/twitter-logo.png" />
            </a>
          </p>

          <p className="navbar-text navbar-right mb-0">
            <a
              className="navbar-link"
              href="https://github.com/reimagined/resolve"
            >
              <img src="/github-logo.png" />
            </a>
          </p>
        </div>
      </div>
    </nav>
  </div>
)

export default Header
