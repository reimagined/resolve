import { execSync } from 'child_process'

function updateResolvePackages(packages, version, useYarn) {
  let command = ''
  if (version) {
    command += useYarn ? `yarn add` : 'npm install'

    for (const packageName of packages) {
      command += ` ${packageName}@${version}`
    }

    command += useYarn ? ' --exact' : ' --save-exact'
  } else {
    command += useYarn ? `yarn upgrade` : 'npm update'

    for (const packageName of packages) {
      command += ` ${packageName}`
    }
  }

  execSync(command)
}

export default updateResolvePackages
