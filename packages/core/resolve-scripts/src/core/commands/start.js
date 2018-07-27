import webpack from '../webpack'

webpack({
  mode: 'production',
  build: false,
  start: true,
  watch: false,
  openBrowser: false
}).catch(error => {
  console.log(error)
})
