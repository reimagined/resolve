#!/usr/bin/env node

/* eslint-disable */
const fs = require('fs');
const semver = require('semver')
const { spawn } = require('child_process')
const regexSemver = () => /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/ig;
const regexMajorMinor = () => /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)/ig;
const releaseBranchPrefix = 'release-'

const execGit = async (...args) => {
  return new Promise((resolve, reject) => {
    const git = spawn('git', args, { encoding: 'utf8' })
    let stdout = ''
    let stderr = ''

    git.stdout.on('data', data => stdout += data)
    git.stderr.on('data', data => stderr += data)
    git.on('exit', (code) => {
      if (code !== 0)
        return reject(new Error(stderr))
      //stdout = stdout.replace(/^\s*$(?:\r\n?|\n)/gm, '')
      if (!stdout.length)
        return resolve([])
      return resolve(stdout.split('\n').filter((data) => data.length !== 0))
    })
  })
}

function readPackageJSON() {
  return JSON.parse(fs.readFileSync('./package.json'));
}

function writePackageJSON(data) {
  fs.writeFileSync('./package.json', JSON.stringify(data, null, 2));
}

function getVersion(timestamp, releaseType) {
  timestamp = timestamp || (new Date().toISOString()).replace(/[:.]/gi, '-');
  releaseType = releaseType || 'canary';
  return `${readPackageJSON().version}-${releaseType}.${timestamp}`;
}

function patch(version) {
  if (!version) {
    console.error(`no version specified`);
    return;
  }
  const packageJSON = readPackageJSON();
  packageJSON.version = version;
  writePackageJSON(packageJSON);
}

function patchName(name) {
  if (!name) {
    console.error(`no name specified`);
    return;
  }
  const packageJSON = readPackageJSON();
  packageJSON.name = name;
  writePackageJSON(packageJSON);
}

function patchDependencies(mask, version) {
  if (!mask) {
    console.error('no package mask specified');
    return 1;
  }

  if (!version) {
    console.error('no new version specified');
    return 1;
  }

  const regExp = new RegExp('^' + mask);
  const packageJSON = readPackageJSON();

  if (!packageJSON) {
    console.log(`No package.json file`);
    return;
  }

  const sections = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ]

  sections.forEach(section => {
    if (!packageJSON[section]) {
      console.log(`No ${section} in package.json`);
      return;
    }

    Object.keys(packageJSON[section]).forEach(function(lib) {
      if (regExp.test(lib)) {
        console.log(`${section}.${lib} (${packageJSON[section][lib]} -> ${version})`);
        packageJSON[section][lib] = version;
      }
    });
  })

  console.log('Patching package.json');
  writePackageJSON(packageJSON);
  console.log('Complete');
  return 0;
}

const findTagsByHash = async hash => {
  try {
    const refMap = await execGit('show-ref', '--tags')

    let foundTags = []

    refMap.forEach(entry => {
      const [ tagHash, tagName ] = entry.split(' ')
      if (hash === tagHash) {
        foundTags.push(tagName.replace('refs/tags/', ''))
      }
    })

    return foundTags
  } catch (err) {
    // for only God known reasons git-show-ref returns exit code of 1 if no tags present
    return []
  }
}

const switchBranch = async branch => (await execGit('checkout', branch))
const currentCommitHash = async () => (await execGit('rev-parse', 'HEAD'))[0]

const managePatchVersion = async branch => {
  // Drone can omit tags fetching, so force it
  await execGit('fetch', '--tags')

  // Determining git state
  await switchBranch(branch)
  const hash = await currentCommitHash()
  const majorMinorMatch = regexMajorMinor().exec(branch)
  if (!majorMinorMatch) {
    throw new Error(`Cannot determine release major.minor version. Possible wrong branch or branch name ${branch}`)
  }
  const majorMinor = majorMinorMatch[0]
  const baseVersion = `${majorMinor}.0`

  // Check package.json
  const range = `>=${baseVersion} <${semver.inc(baseVersion, 'minor')}`
  const packageVersion = readPackageJSON().version
  if (!semver.satisfies(packageVersion, range)) {
    throw new Error(`Branch name version ${baseVersion} and package.json version ${packageVersion} belongs to different semver ranges`)
  }

  // Check if current commit already tagged as release
  const existingTags = await findTagsByHash(hash)
  existingTags.forEach(tag => {
    if (tag.startsWith(releaseBranchPrefix)) {
      throw new Error(`Branch ${branch} head commit already tagged with ${tag}. Possible unexpected start of already completed build.`)
    }
  })

  // Determine and increment patch semver digit
  let latestVersion = baseVersion

  const tags = await execGit('tag', '-l', `${branch}*`)
  if (tags.length) {
    tags.forEach((tag) => {
      const match = regexSemver().exec(tag)
      if (match) {
        const version = match[ 0 ]

        if (semver.satisfies(version, `>=${baseVersion} <${semver.inc(baseVersion, 'minor')}`)
          && semver.gt(version, latestVersion)) {
          latestVersion = version
        }
      }
    })
    latestVersion = semver.inc(latestVersion, 'patch')
  }

  // Modify package.json
  const data = readPackageJSON()
  data.version = latestVersion
  writePackageJSON(data)

  // Output version to stdout
  console.log(latestVersion)
}

const tagRelease = async (branch, version) => {
  // Check params
  if (!version || !version.trim()) {
    throw new Error('Release version must be specified')
  }

  await switchBranch(branch)
  const majorMinorMatch = regexMajorMinor().exec(branch)
  if (!majorMinorMatch) {
    throw new Error('Cannot determine release major.minor version. Possible wrong branch or branch name')
  }
  const majorMinor = majorMinorMatch[0]
  const baseVersion = `${majorMinor}.0`
  const range = `>=${baseVersion} <${semver.inc(baseVersion, 'minor')}`

  if (!semver.satisfies(version, range)) {
    throw new Error(`Version should be within range ${range}`)
  }

  const tag = `${releaseBranchPrefix}${version}`

  await execGit('tag', tag)
  await execGit('push', 'origin', tag)

  console.log(tag)
}

const executeCommand = async command => {
  switch (command) {
    case 'nightly':
      console.log(getVersion(process.argv[3], 'nightly'));
      break;

    case 'patch':
      patch(process.argv[3]);
      break;

    case 'name':
      console.log(JSON.parse(fs.readFileSync('./package.json')).name);
      break;

    case 'set-name':
      patchName(process.argv[3])
      break;

    case 'patch-dependencies':
      process.exit(patchDependencies(process.argv[3], process.argv[4]));
      break;

    case 'private':
      console.log(readPackageJSON().private || false);
      break;

    case 'make-public':
      const packageJSON = readPackageJSON();
      packageJSON.private = false;
      writePackageJSON(packageJSON);
      break;

    case 'semver-inc':
      console.log(semver.inc(readPackageJSON().version, process.argv[3]))
      break;

    case 'git-manage-patch-version':
      try {
        await managePatchVersion(process.argv[3])
      } catch (error) {
        console.error(error.message)
        process.exit(1)
      }
      break;

    case 'git-release-tag':
      try {
        await tagRelease(process.argv[ 3 ], process.argv[ 4 ])
      } catch (error) {
        console.error(error.message)
        process.exit(1)
      }
      break;

    default:
      console.error(`Unknown switch ${command}`);
      process.exit(1)
      break;
  }
}

executeCommand(process.argv[2])
