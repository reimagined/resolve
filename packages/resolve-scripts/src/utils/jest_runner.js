import { execSync } from 'child_process'

const jestRunner = () => {
  execSync(
    'npx jest --testMatch=**/test/unit/*.test.js --verbose ' +
      process.argv.slice(3).join(' '),
    { stdio: 'inherit' }
  )
}

export default jestRunner
