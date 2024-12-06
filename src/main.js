import './assets/main.scss'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives
})

export default createVuetify({
    icons: {
      defaultSet: 'mdi',
    },
  })

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.mount('#app')