const request = require('request')
const octokit = require('@octokit/rest')()

const triggers = {}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main({ gitlab, github, refreshTime }) {
  console.log(JSON.stringify(process.env, null, 2))
  console.log(JSON.stringify({ gitlab, github, refreshTime }, null, 2))

  octokit.authenticate({
    type: 'token',
    token: github.token
  })

  while (true) {
    const { data: pullRequests } = await octokit.pulls.list({
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
        
        console.log({
          PULL_REQUEST_NAME: `${pullRequest.title}`,
          PULL_REQUEST_NUMBER: `${pullRequest.number}`,
          MERGE_COMMIT_SHA: `${pullRequest.merge_commit_sha}`,
          SOURCE_BRANCH_NAME: `${pullRequest.head.ref}`,
          SOURCE_BRANCH_SHA: `${pullRequest.head.sha}`,
          TARGET_BRANCH_NAME: `${pullRequest.base.ref}`,
          TARGET_BRANCH_SHA: `${pullRequest.base.sha}`
        })
        console.log(pullRequest)

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

main({
  refreshTime: 10000,
  gitlab: {
    url: process.env.GITLAB_PIPELINE_URL,
    token: process.env.GITLAB_PIPELINE_TOKEN,
    ref: 'ci/cd'
  },
  github: {
    owner: 'reimagined',
    repo: 'resolve',
    token: process.env.GITHUB_RESOLVE_TOKEN
  }
}).catch(error => {
  console.error(error)
})
