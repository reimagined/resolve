import AdmZip from 'adm-zip'
import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'
import path from 'path'
import rimraf from 'rimraf'
import Octokit from '@octokit/rest'

const octokit = new Octokit()
octokit.authenticate({
  type: 'basic',
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD
})

const rootDir = __dirname
const resolveDevDir = path.join(rootDir, './resolve-dev')
const tarballsDir = path.join(rootDir, './tarballs')

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const fetchGithubDevZip = () => new Promise((resolve, reject) => {
    const data = []
    let dataLen = 0
  
    const req = https.request({
      hostname: 'codeload.github.com',
      port: 443,
      path: '/reimagined/resolve/zip/dev',
      method: 'GET'
    }, (res) => {
      res.on('data', (chunk) => {
        data.push(chunk);
        dataLen += chunk.length;
      })
  
      res.on('end', () => {
        const buf = new Buffer(dataLen);
    
        for (let i=0, len = data.length, pos = 0; i < len; i++) {
          data[i].copy(buf, pos);
          pos += data[i].length;
        }

        const zip = new AdmZip(buf)
        resolve(zip)
      })
    })
    
    req.on('error', reject)
    req.end()
  })
  
const downloadAndExtractResolveDev = async () => {
  await new Promise((resolve, reject) =>
    rimraf(resolveDevDir, err => err ? reject(err) : resolve())
  )

  const zipArchive = await fetchGithubDevZip()
  await new Promise((resolve, reject) =>
    zipArchive.extractAllToAsync(
      rootDir,
      true,
      err => err ? reject(err): resolve()
    )
  )
}

const yarnResolveDev = async () => {
  execSync('yarn', {
    cwd: resolveDevDir,
    stdio: 'inherit'
  })
}

const retrieveMonorepoPackages = async (result = {}, baseDir = path.join(resolveDevDir, './packages')) => {
  for(let elm of fs.readdirSync(baseDir)) {
    if(fs.existsSync(path.join(baseDir, './', elm, './package.json'))) {
      result[elm] = path.join(baseDir, './', elm)
      continue
    }
    try {
      await retrieveMonorepoPackages(result, path.join(baseDir, './', elm))
    } catch(err) {}
  }
  
  return result
}

const packageBaseGithubUrl = 'https://raw.githubusercontent.com/reimagined/resolve/nightly-builds/packages/'

const patchPackageJsons = async (packages, isoTime) => {
  const sections = ['dependencies', 'devDependencies', 'peerDependencies']
  
  for(const packageName of Object.keys(packages)) {
     const packageJsonPath = path.join(packages[packageName], './package.json')
     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString())
     
     for(const section of sections) {
       if(!packageJson.hasOwnProperty(section)) continue
       for(const key of Object.keys(packageJson[section])) {
         if(packages.hasOwnProperty(key)) {
           packageJson[section][key] = `${packageBaseGithubUrl}${key}-${packageJson.version}-${isoTime}.tgz`
         }
       }
     }
     
     fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  }
}

const packPackages = async (packages, isoTime) => {
  await new Promise((resolve, reject) =>
    rimraf(tarballsDir, err => err ? reject(err) : resolve())
  )
  
  fs.mkdirSync(tarballsDir)
  
  const tarballs = []

  for(const packageName of Object.keys(packages)) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(packages[packageName], './package.json')).toString())
    const tarballName = `${packageName}-${packageJson.version}-${isoTime}.tgz`
    
    execSync(`yarn pack --filename=${path.join(tarballsDir, './', tarballName)}`, {
      cwd: packages[packageName],
      stdio: 'inherit'
    })
    
    tarballs.push(tarballName)
  }
  
  return tarballs
}

const publishTarballs = async (tarballs) => {
  for(let tarballName of tarballs) {
    const tarballBase64 = fs.readFileSync(path.join(tarballsDir, './', tarballName)).toString('base64')
  
    await octokit.repos.createFile({
      owner: 'reimagined',
      repo: 'resolve',
      branch: 'nightly-builds',
      path: `packages/${tarballName}`,
      content: tarballBase64,
      message: 'Nightly builds update'
    })
  }

}

const main = async () => {
  while(true) {
    await downloadAndExtractResolveDev()
    await yarnResolveDev()
    const packages = await retrieveMonorepoPackages()
    const isoTime = (new Date()).toLocaleString().replace(/\s|:/g, '-')
    await patchPackageJsons(packages, isoTime)
    const tarballs = await packPackages(packages, isoTime)
    await publishTarballs(tarballs)
    
    console.log(tarballs)
    await delay(10 * 60 * 1000)
  }
}

main().catch((err) => {
  console.log('Fatal error: ', err)
  process.exit(1)
})

