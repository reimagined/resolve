module.exports={
  "title": "reSolve",
  "tagline": "Full stack CQRS, DDD, Event Sourcing framework for Node.js",
  "url": "https://reimagined.github.io",
  "baseUrl": "/resolve/",
  "organizationName": "reimagined",
  "projectName": "resolve",
  "scripts": [
    {
      src: "https://buttons.github.io/buttons.js",
      async: true
    }    
  ],
  "favicon": "img/favicon.png",
  "trailingSlash": "true",
  "customFields": {},
  "onBrokenLinks": "log",
  "onBrokenMarkdownLinks": "log",
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": {
          "showLastUpdateAuthor": false,
          "showLastUpdateTime": false,
          "path": "..\\docs",
          "sidebarPath": ".\\sidebars.json"
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
        "src": "img/resolve-light.svg",
        "srcDark": "img/resolve.svg"
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
      "style": 'dark',
      "links": [
        {
          title: 'Docs',
          items: [
            {
              label: "Documentation Index",
              to: 'docs/index'
            },
            {
              label: "Introduction",
              to: 'docs'
            },
            {
              label: "Step-by-Step Tutorial",
              to: 'docs/tutorial'
            },

          ]
        },
        {
          title: 'Community',
          items: [
            {
              label: "Stack Overflow",
              to: 'https://stackoverflow.com/questions/tagged/resolvejs'
            },
            {
              label: "Twitter",
              to: 'https://twitter.com/resolvejs'
            },
            {
              label: "Facebook",
              to: 'https://www.facebook.com/resolvejs/'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: "GitHub",
              to: 'https://github.com/reimagined/resolve'
            },
            {
              html: `
              <iframe src="https://ghbtns.com/github-btn.html?user=reimagined&repo=resolve&type=star&count=true" frameborder="0" scrolling="0" width="150" height="20" title="GitHub"></iframe>
              `
            }
          ]
        }
      ],
      "copyright": "Copyright © 2021 Developer Express, Inc",
      "logo": {
        "src": "img/resolve.svg"
      }
    },
    "algolia": {
      "indexName": "reimagined_resolve",
      "apiKey": process.env.ALGOLIA_RESOLVE_API_KEY
    },
    "gtag": {
      "trackingID": "UA-118635726-3"
    }
  }
}