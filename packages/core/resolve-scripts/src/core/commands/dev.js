import webpack from '../webpack'

webpack({
  mode: 'development',
  build: true,
  start: true,
  watch: true,
  openBrowser: true
}).catch(error => {
  console.log(error)
})
