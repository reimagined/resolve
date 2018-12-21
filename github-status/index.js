const octokit = require('@octokit/rest')()

const { state, targetUrl, description, context } = require('minimist')(
  process.argv.slice(2)
)

async function main({ gitlab, github }) {
  octokit.authenticate({
    type: 'token',
    token: github.token
  })
}

main({
  state,
  targetUrl,
  description,
  context,
  gitlab: {
    url: process.env.CI_PIPELINE_URL
  },
  github: {
    owner: 'reimagined',
    repo: 'resolve',
    token: process.env.GITHUB_RESOLVE_TOKEN,
    commit_sha: process.env.CI_COMMIT_SHA
  }
}).catch(error => {
  console.error(error)
})
