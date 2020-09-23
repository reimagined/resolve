const { execSync } = require('child_process')
const fs = require('fs')

const version = process.argv[2]
const tag = process.argv[3]

if (!version) {
  throw Error(`version not specified`)
}

if (!tag) {
  throw Error(`tag not specified`)
}

const packageJson = JSON.parse(
  fs.readFileSync('./package.json').toString('utf-8')
)

const { name, private: restricted } = packageJson

if (restricted) {
  console.warn(`skipping removing of private package ${name}`)
  process.exit(0)
}

try {
  execSync(`npm unpublish --force ${name}@${version}`, {
    stdio: 'inherit',
  })
} catch (e) {
  console.warn(e)
  process.exit(0)
}
