import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import DataPage from '../views/DataPage.vue'
import HelpPage from '../views/HelpPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/data',
    name: 'Data',
    component: DataPage
  },
  {
    path: '/help',
    name: 'Help',
    component: HelpPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router