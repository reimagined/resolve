/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

class Footer extends React.Component {
  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.props.config.baseUrl + 'docs/'}>
              Documentation Index
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a
              href="https://stackoverflow.com/questions/tagged/resolvejs"
              target="_blank"
              rel="noreferrer noopener"
            >
              Stack Overflow
            </a>
            <a
              href="https://twitter.com/resolvejs"
              target="_blank"
              rel="noreferrer noopener"
            >
              Twitter
            </a>
            <a
              href="https://www.facebook.com/resolvejs/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Facebook
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://github.com/reimagined/resolve">GitHub</a>
            <a
              className="github-button"
              href="https://github.com/reimagined/resolve"
              data-icon="octicon-star"
              data-count-href="/reimagined/resolve/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub"
            >
              Star
            </a>
          </div>
        </section>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    )
  }
}

module.exports = Footer
