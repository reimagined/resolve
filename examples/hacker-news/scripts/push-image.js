#!/usr/bin/env node
const http = require('http')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const registry = process.argv[2]
const argv = registry.split(':')
const { host, port } = { host: argv[0], port: argv[1] }

const PROJECT_NAME = process.env.PROJECT_NAME

function showStdout(args) {
  // eslint-disable-next-line no-console
  console.log(args.stdout)
}

function getRegistryData(repoName) {
  const options = {
    host,
    port,
    path: `/v2/${repoName}/tags/list`
  }

  return new Promise((resolve, reject) =>
    http.get(options, res => {
      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => resolve(data))
      res.on('error', reject)
    })
  )
}

;(async function() {
  const errorLogger = err =>
    err instanceof Error && err.stack
      ? console.log(`Error ${err.description} at ${err.stack}`) // eslint-disable-line no-console
      : console.log(`${err}`) // eslint-disable-line no-console

  process.on('unhandledRejection', errorLogger)

  process.on('uncaughtException', errorLogger)

  try {
    const repoName = 'hackernews'
    const data = await getRegistryData(repoName)
    const { tags } = JSON.parse(data)
    let newTag
    try {
      tags.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      newTag = parseInt(tags[tags.length - 1], 10) + 1
    } catch (_) {
      newTag = 1
    }
    const registryTagName = `${registry}/${repoName}:${newTag}`

    showStdout(await exec(`docker build -t ${PROJECT_NAME}_${repoName} .`))
    showStdout(
      await exec(`docker tag ${PROJECT_NAME}_${repoName} ${registryTagName}`)
    )
    showStdout(
      await exec(`docker push --disable-content-trust ${registryTagName}`)
    )
    showStdout(await exec(`docker rmi ${registryTagName}`))
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    process.exit(1)
  }
})()
