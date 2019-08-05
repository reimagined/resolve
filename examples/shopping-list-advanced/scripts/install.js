const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const yarnExecutablePath = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'

const spawnAsync = (command, args, options) =>
  new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, options)

    childProcess.on('close', code => {
      if (String(code) !== String(0)) {
        reject({ code, command, args, options })
        return
      }
      resolve()
    })

    childProcess.on('error', error => {
      reject(error)
    })
  })

const timestamp = Date.now()

const [_major, _minor, _patch] = require('./package').version.split('.')

const canaryVersion = [_major, _minor, (+_patch || 0) + timestamp].join('.')

const safeName = str =>
  `${str.replace('@', '').replace('/', '-')}-v${canaryVersion}`

const removeExtra = dir => {
  const list = fs.readdirSync(dir)
  for (let i = 0; i < list.length; i++) {
    const filename = path.join(dir, list[i])
    const stat = fs.lstatSync(filename)

    if (filename === '.' || filename === '..') {
      continue
    }
    if (stat.isDirectory()) {
      removeExtra(filename)
    } else {
      fs.unlinkSync(filename)
    }
  }
  fs.rmdirSync(dir)
}

const main = async () => {
  // 2. Start static server
  const staticServer = http.createServer((req, res) => {
    const fileName = req.url.slice(1)

    const filePath = path.join(__dirname, '..', 'node_modules', fileName)
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

  // 3. Prepare redefine map
  const redefine = {}
  const resolvePackages = []

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

  for (const { name } of localPackages) {
    redefine[name] = `http://${address}:${port}/${safeName(name)}.tgz`
  }

  let isResolveMonorepo = false
  try {
    isResolveMonorepo = require('../../../package').name === 'resolve'
  } catch (e) {}

  if (isResolveMonorepo) {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const resolvePackagesNames = require('create-resolve-app').resolvePackages

    // 4. Remove all resolve packages in node_modules
    for (const { directory } of localPackages) {
      for (const name of resolvePackagesNames) {
        const resolvePackagePath = path.normalize(
          path.join(directory, 'node_modules', name)
        )

        if (fs.existsSync(resolvePackagePath)) {
          removeExtra(resolvePackagePath)
        }
      }
    }

    resolvePackages.push(
      ...resolvePackagesNames.map(packageName => ({
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

  // 5. Backup package.json-s and setup rollback
  const backup = {}
  for (const { directory } of [...localPackages, ...resolvePackages]) {
    backup[directory] = fs.readFileSync(path.join(directory, 'package.json'))
    fs.copyFileSync(
      path.join(directory, 'package.json'),
      path.join(directory, 'package.backup.json')
    )
  }

  const rollback = () => {
    for (const { directory } of [...localPackages, ...resolvePackages]) {
      fs.writeFileSync(path.join(directory, 'package.json'), backup[directory])
      try {
        fs.unlinkSync(path.join(directory, 'package.backup.json'))
      } catch (e) {}
    }
  }

  process.on('SIGINT', rollback)
  process.on('exit', rollback)

  // 6. Patch package.json-s
  for (const { directory } of [...resolvePackages, ...localPackages]) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'))
    )

    packageJson.version = canaryVersion

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
          packageJson[namespace][name] =
            namespace === 'peerDependencies' ? '*' : redefine[name]
        }
      }
    }

    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }

  // 7. Create tar.gz-s
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'node_modules'))
  }

  const promises = []
  for (const { name, directory } of [...resolvePackages, ...localPackages]) {
    promises.push(
      spawnAsync(
        yarnExecutablePath,
        [
          'pack',
          '--filename',
          path.join(__dirname, '..', 'node_modules', `${safeName(name)}.tgz`)
        ],
        { cwd: directory }
      )
    )
  }

  await Promise.all(promises)

  // 8. Install packages
  for (const { directory } of localPackages) {
    await spawnAsync(yarnExecutablePath, ['install'], {
      cwd: directory,
      stdio: 'inherit'
    })
  }

  // 9. Remove tar.gz-s
  for (const { name } of [...resolvePackages, ...localPackages]) {
    const packagePath = path.join(
      __dirname,
      '..',
      'node_modules',
      `${safeName(name)}.tgz`
    )
    fs.unlinkSync(packagePath)
  }

  // 10. Make symlinks
  for (const targetPackage of localPackages) {
    for (const sourcePackage of localPackages) {
      const symlinkFrom = sourcePackage.directory
      const symlinkTo = path.normalize(
        path.join(targetPackage.directory, 'node_modules', sourcePackage.name)
      )
      try {
        try {
          fs.renameSync(symlinkTo, `${symlinkTo}.backup.${canaryVersion}`)
        } catch (error) {
          throw error
        }
        try {
          fs.symlinkSync(symlinkFrom, symlinkTo, 'junction')
        } catch (error) {
          fs.renameSync(`${symlinkTo}.backup.${canaryVersion}`, symlinkTo)
          throw error
        }
      } catch (error) {
        continue
      }
      // eslint-disable-next-line no-console
      console.log('symlink', symlinkFrom, '->', symlinkTo)
    }
  }

  // 11. Finish
  rollback()
  process.exit(0)
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
