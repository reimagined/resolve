import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import App from './App.vue'

const entryPoint = ({ rootPath, staticPath }) => {
  const appContainer = document.body.firstElementChild
  appContainer.setAttribute('id', 'app-container')

  Vue.use(BootstrapVue)
  new Vue({
    data: { rootPath, staticPath },
    render: h => h(App),
    el: '#app-container'
  })
}

export default entryPoint
