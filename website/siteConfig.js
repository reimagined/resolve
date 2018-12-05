/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

const siteConfig = {
  title: 'ReSolve', // Title for your website.
  tagline: 'Full stack CQRS, DDD, event sourcing JavaScript framework',
  url: 'https://reimagined.github.io', // Your website URL
  baseUrl: '/resolve/', // Base URL for your project */

  projectName: 'reSolve',
  organizationName: 'reimagined',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: 'index', label: 'Docs Index' },
    { doc: 'faq', label: 'FAQ' },
    { doc: 'troubleshooting', label: 'Troubleshooting' }
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
  cleanUrl: true
}

module.exports = siteConfig
