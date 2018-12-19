const minimist = require('minimist')
const request = require('request')
const octokit = require('@octokit/rest')()

const triggers = {}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main({ gitlab, github, refreshTime }) {
  octokit.authenticate({
    type: 'token',
    token: github.token
  })

  while (true) {
    const { data: pullRequests } = await octokit.pullRequests.getAll({
      owner: github.owner,
      repo: github.repo
    })

    for (const pullRequest of pullRequests) {
      const prevMergeCommitSha = triggers[pullRequest.number]
      if (
        pullRequest.merge_commit_sha &&
        prevMergeCommitSha !== pullRequest.merge_commit_sha
      ) {
        triggers[pullRequest.number] = pullRequest.merge_commit_sha

        request(
          {
            method: 'post',
            body: {
              token: gitlab.token,
              ref: gitlab.ref,
              variables: {
                PULL_REQUEST_NAME: `${pullRequest.title}`,
                PULL_REQUEST_NUMBER: `${pullRequest.number}`,
                MERGE_COMMIT_SHA: `${pullRequest.merge_commit_sha}`,
                SOURCE_BRANCH_NAME: `${pullRequest.head.ref}`,
                SOURCE_BRANCH_SHA: `${pullRequest.head.sha}`,
                TARGET_BRANCH_NAME: `${pullRequest.base.ref}`,
                TARGET_BRANCH_SHA: `${pullRequest.base.sha}`
              }
            },
            json: true,
            url: gitlab.url
          },
          err => {
            if (err) {
              triggers[pullRequest.number] = prevMergeCommitSha
              console.error(err)
              return
            }

            console.log(
              `pull request from "${pullRequest.head.ref}" to "${
                pullRequest.base.ref
              }"`
            )
          }
        )
      }
    }

    await delay(refreshTime)
  }
}

const { gitlabUrl, gitlabToken, githubToken, refreshTime = 10000 } = minimist(
  process.argv.slice(2)
)

if (!gitlabUrl) {
  throw new Error('Option "gitlabUrl" is required and must be a String')
}
if (!gitlabToken) {
  throw new Error('Option "gitlabToken" is required and must be a String')
}
if (!githubToken) {
  throw new Error('Option "githubToken" is required and must be a String')
}

main({
  refreshTime: +refreshTime,
  gitlab: {
    url: gitlabUrl,
    token: gitlabToken,
    ref: 'ci/cd'
  },
  github: {
    owner: 'reimagined',
    repo: 'resolve',
    token: githubToken
  }
})
