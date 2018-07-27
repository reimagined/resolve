import webpack from '../webpack'

webpack({
  mode: 'production',
  build: true,
  start: false,
  watch: false,
  openBrowser: false
}).catch(error => {
  console.log(error)
})
