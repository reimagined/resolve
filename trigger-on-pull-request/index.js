const fs = require('fs')
const path = require('path')
const request = require('request')
const octokit = require('@octokit/rest')()

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const triggers = {
  set: (pullRequestNumber, mergeCommitSha) => {
    try {
      const state = fs.existsSync(path.join(__dirname, 'state.json'))
        ? JSON.parse(
          fs
            .readFileSync(path.join(__dirname, 'state.json'), {
              encoding: 'utf-8'
            })
            .toString('utf-8')
        )
        : {}
      state[pullRequestNumber] = mergeCommitSha
      fs.writeFileSync(
        path.join(__dirname, 'state.json'),
        JSON.stringify(state, null, 2),
        {
          encoding: 'utf-8'
        }
      )
    } catch (error) {
      console.error(error)
    }
  },
  get: pullRequestNumber => {
    try {
      const state = JSON.parse(
        fs
          .readFileSync(path.join(__dirname, 'state.json'), {
            encoding: 'utf-8'
          })
          .toString('utf-8')
      )
      const mergeCommitSha = state[pullRequestNumber]
      return mergeCommitSha
    } catch (error) {
      console.error(error)
    }
  }
}

async function main({ gitlab, github, refreshTime }) {
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
      const prevMergeCommitSha = triggers.get(pullRequest.number)
      if (
        pullRequest.merge_commit_sha &&
        prevMergeCommitSha !== pullRequest.merge_commit_sha
      ) {
        triggers.set(pullRequest.number, pullRequest.merge_commit_sha)

        request(
          {
            method: 'post',
            body: {
              token: gitlab.token,
              ref: gitlab.ref,
              variables: {
                PULL_REQUEST_NAME: `${pullRequest.title}`,
                PULL_REQUEST_NUMBER: `${pullRequest.number}`,
                HEAD_COMMIT_SHA: `${pullRequest.head.sha}`,
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
          error => {
            if (error) {
              triggers.set(pullRequest.number, prevMergeCommitSha)
              console.error(error)
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
