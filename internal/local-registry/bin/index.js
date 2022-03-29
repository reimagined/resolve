#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const http = require('http')
const {
  getResolvePackages,
  getLocalRegistryConfig,
  safeName,
} = require('@internal/helpers')

const localRegistry = getLocalRegistryConfig()

http
  .createServer((req, res) => {
    const fileName = req.url.slice(1).replace(/\?.*$/, '')

    const filePath = path.join(localRegistry.directory, fileName)

    const resolvePackagesFiles = getResolvePackages().map(safeName)

    if (!resolvePackagesFiles.includes(fileName) || !fs.existsSync(filePath)) {
      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Content-Length': 0,
      })
      res.end()
      return
    }

    const stat = fs.statSync(filePath)

    res.writeHead(200, {
      'Content-Type': 'application/tar+gzip',
      'Content-Length': stat.size,
    })

    const readStream = fs.createReadStream(filePath)
    readStream.pipe(res)
  })
  .listen(localRegistry.port, localRegistry.host, (error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return
    }
    // eslint-disable-next-line no-console
    console.log(
      `Local registry listening on http://${localRegistry.host}:${localRegistry.port}`
    )
  })
