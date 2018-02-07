import request from 'request'
import spawn from 'cross-spawn'
import fs from 'fs'
import path from 'path'
import { EOL } from 'os'

function getResolvePackages() {
  return new Promise((resolve, reject) => {
    request(
      'https://www.npmjs.com/-/search?text=maintainer:reimagined&size=100',
      { json: true },
      (fetchError, response, body) => {
        if (fetchError) {
          reject('Package list loading error:' + fetchError.stack)
        }
        try {
          resolve(body.objects.map(object => object.package.name))
        } catch (parseError) {
          reject('Package list loading error:' + parseError.stack)
        }
      }
    )
  })
}

function updateResolvePackages(packages, version, exactVersions) {
  const command = 'npm'

  const args = version
    ? [
        'install',
        exactVersions ? '--save-exact' : '',
        ...packages.map(name => `${name}@${version}`)
      ]
    : ['update', ...packages]

  return new Promise((resolve, reject) => {
    const proc = spawn.sync(command, args, { stdio: 'inherit' })
    if (proc.status !== 0) {
      reject(`\`${command} ${args.join(' ')}\` failed`)
    }
    resolve()
  })
}

async function update() {
  const exactVersions = process.argv[3] === '--exact-versions'
  const version = exactVersions ? process.argv[4] : process.argv[3]

  const resolvePackages = await getResolvePackages()

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), './package.json'))
  )

  const appPackages = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }

  const packages = resolvePackages.filter(name => appPackages[name])

  if (!version) {
    const badPackages = packages.filter(
      name => !/\^|~|x|\*/.test(appPackages[name].split('-')[0])
    )
    if (badPackages.length > 0) {
      throw new Error(
        'Use the "update $(version)" command as your project ' +
          `contains dependencies with fixed versions.${EOL}` +
          `List of dependencies with fixed versions: ${badPackages.join(', ')}`
      )
    }
  }

  await updateResolvePackages(packages, version, exactVersions)
}

update().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error.toString())
})
