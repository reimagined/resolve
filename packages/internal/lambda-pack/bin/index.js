#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const { safeName, patchPackageJson } = require('@internal/helpers')

const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'))
)

const rollback = patchPackageJson(process.cwd())

const stream = fs.createWriteStream(`${safeName(packageJson.name)}.zip`)
const archive = archiver('zip', {
  zlib: { level: 9 }
})
const result = new Promise((resolve, reject) => {
  archive.on('error', reject)
  stream.on('close', () => resolve(archive.pointer()))
})
archive.directory(path, false)
archive.pipe(stream)
archive.finalize()

result.then(() => {
  rollback
})