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
  console.warn(`skipping publishing of private package ${name}`)
  process.exit(0)
}

const view = execSync(`npm view ${name}@${version} 2>/dev/null`).toString()

if (view !== '') {
  console.warn(`package ${name} version ${version} already published`)
  process.exit(0)
}

console.debug(`bumping to version ${version}`)
packageJson.version = version
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))

console.debug(`publishing with tag ${tag}`)

try {
  execSync(`npm publish --access=public --tag=${tag} --unsafe-perm --silent`, {
    stdio: 'inherit',
  })
} catch (e) {
  console.warn(e)
}
