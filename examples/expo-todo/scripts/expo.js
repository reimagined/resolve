const fs = require('fs')
const { execSync } = require('child_process')

// For example:
// npm run expo
// or
// npm run expo https://expo-todo.com

const origin = process.argv[2] || require('my-local-ip')();

const pathToMain = require('../package.json').main;

if(!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

fs.writeFileSync(
  pathToMain,
  `
import { customizeOrigin } from 'resolve-redux'

customizeOrigin("${origin}")

require('./client')

  `.trim()
)

execSync(
  'npx react-native-scripts start',
  { stdio: 'inherit' }
)

