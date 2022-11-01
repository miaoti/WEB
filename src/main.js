
import Vue from 'vue'
import App from './App'
import router from './router'

import messageUI from './components/message';

Vue.config.productionTip = false
Vue.prototype.$message = messageUI;

new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
