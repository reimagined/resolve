const fs = require('fs')
const path = require('path')
const http = require('http')
const util = require('util')
//const { execSync } = require('child_process')

const exec = util.promisify(require('child_process').exec)

const canaryVersion = Date.now()

const safeName = str => `${str.replace('/', '__')}-canary-${canaryVersion}`

const rmdir = function(dir) {
  const list = fs.readdirSync(dir);
  for(let i = 0; i < list.length; i++) {
    const filename = path.join(dir, list[i]);
    const stat = fs.statSync(filename);
    
    if(filename == '.' || filename == '..') {
      continue
    }
    if(stat.isDirectory()) {
      rmdir(filename);
    } else {
      fs.unlinkSync(filename)
    }
  }
  fs.rmdirSync(dir)
}

const main = async () => {
  // 0. Start static server
  const staticServer = http.createServer((req, res) => {
    const tgzName = req.url.slice(1)

    const filePath = path.join(__dirname, '..', 'node_modules', tgzName)
    const stat = fs.statSync(filePath)

    res.writeHead(200, {
      'Content-Type': 'application/tar+gzip',
      'Content-Length': stat.size
    })

    const readStream = fs.createReadStream(filePath)
    readStream.pipe(res)
  })

  const { port, address } = await new Promise(resolve => {
    staticServer.listen(0, '127.0.0.1', () => {
      resolve(staticServer.address())
    })
  })

  // 1. Prepare redefine map
  const redefine = {}
  const resolvePackages = []

  let isResolveMonorepo = false
  try {
    isResolveMonorepo = require('../../../package').name === 'resolve'
  } catch (e) {}

  if (isResolveMonorepo) {
    resolvePackages.push(
      ...require('create-resolve-app').resolvePackages.map(packageName => ({
        name: packageName,
        directory: path.dirname(
          require.resolve(path.join(packageName, 'package.json'))
        )
      }))
    )

    for (const { name } of resolvePackages) {
      redefine[name] = `http://${address}:${port}/${safeName(name)}.tgz`
    }
  }

  const localPackages = fs
    .readdirSync(path.join(__dirname, '..'))
    .filter(directory => {
      try {
        require(path.join(__dirname, '..', directory, 'package.json'))
        return true
      } catch (e) {
        return false
      }
    })
    .map(directory => ({
      name: require(path.join(__dirname, '..', directory, 'package.json')).name,
      directory: path.join(__dirname, '..', directory)
    }))

  for (const { name, directory } of localPackages) {
    redefine[name] = `http://${address}:${port}/${safeName(name)}.tgz`
  }

  // 2. Backup package.json-s and setup rollback
  for (const { directory } of [...localPackages, ...resolvePackages]) {
    fs.copyFileSync(
      path.join(directory, 'package.json'),
      path.join(directory, 'package.backup.json')
    )
  }

  const rollback = () => {
    for (const { directory } of [...localPackages, ...resolvePackages]) {
      fs.copyFileSync(
        path.join(directory, 'package.backup.json'),
        path.join(directory, 'package.json')
      )
      fs.unlinkSync(path.join(directory, 'package.backup.json'))
    }
  }

  process.on('SIGINT', rollback)
  process.on('exit', rollback)

  // 3. Patch package.json-s
  for (const { directory } of [...resolvePackages, ...localPackages]) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'))
    )

    for (const namespace of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies'
    ]) {
      if (!packageJson[namespace]) {
        continue
      }
      for (const { name } of [...resolvePackages, ...localPackages]) {
        if (packageJson[namespace][name]) {
          packageJson[namespace][name] = redefine[name]
        }
      }
    }

    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }

  // 4. Create tar.gz-s
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'node_modules'))
  }

  const promises = []
  for (const { name, directory } of [...resolvePackages, ...localPackages]) {
    promises.push(exec(
      `yarn pack --filename=${JSON.stringify(
        path.join(__dirname, '..', 'node_modules', `${safeName(name)}.tgz`)
      )}`,
      { cwd: directory, stdio: 'inherit' }
    ))
  }
  
  await Promise.all(promises)
  
  // 5. Install packages
  for (const { directory } of localPackages) {
    console.log(
      JSON.parse(fs.readFileSync(path.join(directory, 'package.json')))
    )

    const { stdout } = await exec('yarn', { cwd: directory })
    console.log(stdout)
  }

  // 6. Make symlinks
  try {
    rmdir(path.join(
      __dirname, '..', 'native', 'node_modules', '@shopping-list-advanced', 'ui'
    ))
  } catch (e) {
    console.warn(e)
  }
  
  try {
    fs.symlinkSync(
      path.join(
        __dirname, '..', 'ui'
      ),
      path.join(
        __dirname, '..', 'native', 'node_modules', '@shopping-list-advanced', 'ui'
      ),
      'junction'
    )
  } catch (e) {
    console.warn(e)
  }

  // 7. Finish
  process.exit(0)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
