/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

const GITHUB_URL = 'https://github.com/reimagined/resolve'

const siteConfig = {
  title: 'reSolve', // Title for your website.
  tagline: 'Full stack CQRS, DDD, event sourcing JavaScript framework',
  url: 'https://reimagined.github.io', // Your website URL
  baseUrl: '/resolve/', // Base URL for your project */

  projectName: 'reSolve',
  organizationName: 'reimagined',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { blog: true, label: 'Blog' },
    { doc: 'index', label: 'Docs' },
    { doc: 'faq', label: 'FAQ' },
    { search: true },
    { href: GITHUB_URL, label: 'GitHub' }
  ],

  /* path to images for header/footer */
  headerIcon: 'img/resolve.svg',
  footerIcon: 'img/resolve.svg',

  /* Colors for website */
  colors: {
    primaryColor: '#34449F',
    secondaryColor: '#7189D3'
  },

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} reimagined`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'default'
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,

  algolia: {
    apiKey: process.env.ALGOLIA_RESOLVE_API_KEY,
    indexName: 'reimagined_resolve'
  }
}

module.exports = siteConfig
