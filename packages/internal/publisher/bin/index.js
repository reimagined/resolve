const { patch, getResolveDir } = require('@internal/helpers')
const { execSync } = require('child_process')

const [version] = process.argv.slice(2)
const gitLogin = ''
const gitPassword = ''
const gitRepo = ''
const npmEmail = ''
const resolvePath = getResolveDir()

execSync('echo Publish script. By default, there were global packages: yarn, npm, oao.', {stdio: 'inherit'})
execSync(`echo Branch ${version} creation...`, {stdio: 'inherit'})
execSync('git config user.name "Server Publisher"', { cwd: resolvePath })
execSync(`git config user.email ${npmEmail}`, { cwd: resolvePath })

execSync('git reset --hard origin/master', { cwd: resolvePath })
execSync('git checkout master', { cwd: resolvePath })
execSync('git pull', { cwd: resolvePath })
execSync('git reset --hard origin/master', { cwd: resolvePath })
execSync('git checkout dev', { cwd: resolvePath })
execSync('git pull', { cwd: resolvePath })
execSync('git reset --hard origin/dev', { cwd: resolvePath })

execSync('git checkout master', { cwd: resolvePath })
execSync('git pull', { cwd: resolvePath })
execSync(`git checkout -b v${version}`, { cwd: resolvePath })
execSync(`git push https://${gitLogin}:${gitPassword}@${gitRepo} v${version}`, { cwd: resolvePath })

execSync('echo Version changing...', {stdio: 'inherit'})
patch(version)

execSync('yarn clean', { cwd: resolvePath })
execSync('yarn', { cwd: resolvePath })
execSync('yarn prettier', { cwd: resolvePath })

execSync('echo Publishing...', {stdio: 'inherit'})
execSync('git add -u', { cwd: resolvePath })
execSync(`git commit -m v${version}`, { cwd: resolvePath })
execSync(`git push https://${gitLogin}:${gitPassword}@${gitRepo} v${version}`, { cwd: resolvePath })
execSync('npx oao all -i "{examples/*,packages/internal/*}" "npm publish --tag latest --access public"', { cwd: resolvePath })

execSync('echo Tag creation...', {stdio: 'inherit'})
execSync('git checkout master', { cwd: resolvePath })
execSync(`git merge -m "Merge" v${version}`, { cwd: resolvePath })
execSync(`git push https://${gitLogin}:${gitPassword}@${gitRepo} master`, { cwd: resolvePath })
execSync(`git branch -d ${version}`, { cwd: resolvePath })
execSync(`git push https://${gitLogin}:${gitPassword}@${gitRepo} --delete v${version}`, { cwd: resolvePath })
execSync(`git tag -a v${version} -m v${version}`, { cwd: resolvePath })
execSync(`git push https://${gitLogin}:${gitPassword}@${gitRepo} --tags`, { cwd: resolvePath })
execSync('git checkout dev', { cwd: resolvePath })
execSync('git pull', { cwd: resolvePath })
execSync('git merge -m "Merge" master', { cwd: resolvePath })
execSync(`git push https://${gitLogin}:${gitPassword}@${gitRepo} dev`, { cwd: resolvePath })