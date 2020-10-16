module.exports = {
  patchDependencies: (mask, version, packageJSON) => {
    if (!mask) {
      throw Error('no package mask specified')
    }

    if (!version) {
      throw Error('no new version specified')
    }

    const regExp = new RegExp('^' + mask)

    if (!packageJSON) {
      console.log(`No package.json file`)
      return
    }

    const sections = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]

    sections.forEach((section) => {
      if (!packageJSON[section]) {
        console.log(`No ${section} in package.json`)
        return
      }

      Object.keys(packageJSON[section]).forEach(function (lib) {
        if (regExp.test(lib)) {
          console.log(
            `${section}.${lib} (${packageJSON[section][lib]} -> ${version})`
          )
          packageJSON[section][lib] = version
        }
      })
    })
  },
}
