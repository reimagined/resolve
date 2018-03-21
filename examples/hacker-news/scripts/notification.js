#!/usr/bin/env node
const { request } = require('https')
const { parse } = require('url')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const status = process.argv[2]
const buildUrl = process.argv[3]
const webhook = process.argv[4]
const currentBranch = process.argv[5]

function getThemeColor(stat) {
  return stat === 'SUCCESS' ? '28A745' : 'CB2431'
}

function getCommitInfo(format) {
  return `git rev-list --max-count=1 --format=%${format} HEAD | sed -n '$p'`
}

function getRepoInfo(options) {
  return `git rev-parse ${options} HEAD`
}

function getRepoName(url) {
  const pathName = url.split('/')
  return pathName[pathName.length - 1].split('.')[0]
}

function execAndStdoutSanitize(command) {
  return exec(command).then(({ stdout }) =>
    stdout.replace(/(?:\r\n|\r|\n)/g, '')
  )
}

;(async function() {
  const errorLogger = err =>
    err instanceof Error && err.stack
      ? // eslint-disable-next-line no-console
        console.log(`Error ${err.description} at ${err.stack}`)
      : // eslint-disable-next-line no-console
        console.log(`${err}`)

  process.on('unhandledRejection', errorLogger)

  process.on('uncaughtException', errorLogger)

  const [commitName, authorName, commitSha, repoUrl] = await Promise.all([
    execAndStdoutSanitize(getCommitInfo('s')),
    execAndStdoutSanitize(getCommitInfo('an')),
    execAndStdoutSanitize(getRepoInfo('')),
    execAndStdoutSanitize('git config --get remote.origin.url')
  ])

  const repoName = getRepoName(repoUrl)

  const data = JSON.stringify({
    title: `${status} ${repoName} on branch ${currentBranch}`,
    themeColor: `${getThemeColor(status)}`,
    text: `**${commitName}** by ${authorName}`,
    potentialAction: [
      {
        '@context': 'https://schema.org',
        '@type': 'ViewAction',
        name: 'View build on Jenkins',
        target: [`${buildUrl}`]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ViewAction',
        name: 'View commit',
        target: [
          `${repoUrl
            .split('.')
            .slice(0, -1)
            .join('.')}/commit/${commitSha}`
        ]
      }
    ]
  })

  const options = {
    host: parse(webhook).hostname,
    path: parse(webhook).pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }

  const req = request(options, res => {
    const { statusCode } = res
    // eslint-disable-next-line no-console
    console.log(statusCode)
  })

  req.write(data)
  req.end()
})()
