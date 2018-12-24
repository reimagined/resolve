const octokit = require('@octokit/rest')()
const { Url } = require('url')

const { state, targetUrl, description, context } = require('minimist')(
  process.argv.slice(2)
)

if (!['error', 'failure', 'pending', 'success'].includes(state)) {
  throw new Error(
    'Option "state" is required and must be a one of ["error", "failure", "pending", "success"]'
  )
}

if (targetUrl != null && targetUrl !== String(targetUrl)) {
  try {
    new Url(targetUrl)
  } catch (e) {
    throw new Error('Option "targetUrl" is required and must be a String')
  }
}

if (description != null && description !== String(description)) {
  throw new Error('Option "description" is required and must be a String')
}

if (context != null && context !== String(context)) {
  throw new Error('Option "context" is required and must be a String')
}

async function main({ owner, repo, token, commitSha, state, targetUrl }) {
  octokit.authenticate({
    type: 'token',
    token
  })

  await octokit.repos.createStatus({
    owner,
    repo,
    sha: commitSha,
    state,
    target_url: targetUrl,
    description,
    context
  })
}

main({
  owner: 'reimagined',
  repo: 'resolve',
  token: process.env.GITHUB_RESOLVE_TOKEN,
  commitSha: process.env.HEAD_COMMIT_SHA,
  state,
  targetUrl,
  description,
  context
}).catch(error => {
  console.error(error)
})
