module.exports={
  "title": "reSolve",
  "tagline": "Full stack CQRS, DDD, Event Sourcing framework for Node.js",
  "url": "https://reimagined.github.io",
  "baseUrl": "/resolve/",
  "organizationName": "reimagined",
  "projectName": "reSolve",
  "scripts": [
    "https://buttons.github.io/buttons.js"
  ],
  "favicon": "",
  "customFields": {},
  "onBrokenLinks": "log",
  "onBrokenMarkdownLinks": "log",
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": {
          "homePageId": "index",
          "showLastUpdateAuthor": true,
          "showLastUpdateTime": true,
          "path": "..\\docs",
          "sidebarPath": "..\\website\\sidebars.json"
        },
        "blog": {
          "path": "blog"
        },
        "theme": {
          "customCss": "..\\src\\css\\customTheme.css"
        }
      }
    ]
  ],
  "plugins": [],
  "themeConfig": {
    "navbar": {
      "title": "reSolve",
      "logo": {
        "src": "img/resolve.svg"
      },
      "items": [
        {
          "href": "https://medium.com/resolvejs",
          "label": "Blog",
          "position": "left"
        },
        {
          "to": "docs/",
          "label": "Docs",
          "position": "left"
        },
        {
          "to": "docs/tutorial",
          "label": "Tutorial",
          "position": "left"
        },
        {
          "href": "https://github.com/reimagined/resolve",
          "label": "GitHub",
          "position": "left"
        }
      ]
    },
    "image": "img/reSolve400x400-fill.png",
    "footer": {
      "links": [],
      "copyright": "Copyright © 2021 Developer Express, Inc",
      "logo": {
        "src": "img/resolve.svg"
      }
    },
    "algolia": {
      "indexName": "reimagined_resolve"
    },
    "gtag": {
      "trackingID": "UA-118635726-3"
    }
  }
}