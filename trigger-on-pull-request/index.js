const octokit = require('@octokit/rest')()
const Gitlab = require('gitlab')
const request = require('request')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const triggers = new Map()

const gitlabProjectId = 'reimagined/resolve'

async function cancelPipelines(PipelinesService) {
  const pipelines = await PipelinesService.all(gitlabProjectId)

  const activePipelines = pipelines.filter(
    ({ status }) => status === 'running' || status === 'pending'
  )

  for (const { id: pipelineId } of activePipelines) {
    await PipelinesService.cancel(gitlabProjectId, pipelineId)
    console.log(`stop pipeline "${pipelineId}"`)
  }
}

async function main({ gitlab, github, refreshTime }) {
  const PipelinesService = new Gitlab.Pipelines({
    token: gitlab.personalAccessToken
  })

  try {
    await cancelPipelines(PipelinesService)
  } catch (_) {
    try {
      await cancelPipelines(PipelinesService)
    } catch (error) {
      console.error(error)
    }
  }

  octokit.authenticate({
    type: 'token',
    token: github.token
  })

  while (true) {
    let pullRequests = []
    try {
      pullRequests = (await octokit.pulls.list({
        owner: github.owner,
        repo: github.repo
      })).data
    } catch (error) {
      console.error(error)
      continue
    }

    for (const pullRequest of pullRequests) {
      const prevMergeCommitSha = triggers.get(pullRequest.number)
      if (
        pullRequest.merge_commit_sha &&
        prevMergeCommitSha !== pullRequest.merge_commit_sha
      ) {
        triggers.set(pullRequest.number, pullRequest.merge_commit_sha)

        // TODO. Use require('gitlab'). https://github.com/jdalrymple/node-gitlab/issues/254
        request(
          {
            url: gitlab.pipelineUrl,
            method: 'post',
            body: {
              token: gitlab.pipelineToken,
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
            json: true
          },
          (error, { statusCode, statusMessage }) => {
            if (error) {
              triggers.set(pullRequest.number, prevMergeCommitSha)
              console.error(error)
              return
            }

            if (!(statusCode >= 200 && statusCode < 300)) {
              console.error({
                statusCode,
                statusMessage
              })
              return
            }

            console.log(
              `pull request from "${pullRequest.head.ref}" to "${
                pullRequest.base.ref
              }" { number: ${pullRequest.number}, head: "${
                pullRequest.head.sha
              }" }`
            )
          }
        )
      }
    }

    await delay(refreshTime)
  }
}

main({
  refreshTime: 15000,
  gitlab: {
    ref: 'ci/cd',
    pipelineUrl: process.env.GITLAB_PIPELINE_URL,
    pipelineToken: process.env.GITLAB_PIPELINE_TOKEN,
    personalAccessToken: process.env.GITLAB_PERSONAL_ACCESS_TOKEN
  },
  github: {
    owner: 'reimagined',
    repo: 'resolve',
    token: process.env.GITHUB_RESOLVE_TOKEN
  }
}).catch(error => {
  console.error(error)
})
