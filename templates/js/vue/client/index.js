import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { getClient } from '@resolve-js/client'
import App from './App.vue'
const entryPoint = (clientContext) => {
  const client = getClient(clientContext)
  const appContainer = document.body.firstElementChild
  appContainer.setAttribute('id', 'app-container')
  Vue.use(BootstrapVue)
  new Vue({
    data: { client },
    render: (h) => h(App),
    el: '#app-container',
  })
}
export default entryPoint
