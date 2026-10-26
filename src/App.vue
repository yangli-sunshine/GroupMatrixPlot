<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const isSidebarCollapsed = ref(false)

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<template>
  <div class="app-container">
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <h1 v-if="!isSidebarCollapsed">Grouped Matrix Plotting</h1>
        <div class="logo-icon" v-else>GMP</div>
      </div>
      <nav class="sidebar-nav">
        <RouterLink to="/" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span class="nav-text" v-if="!isSidebarCollapsed">首页</span>
        </RouterLink>
        <RouterLink to="/data" class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-text" v-if="!isSidebarCollapsed">数据与绘图</span>
        </RouterLink>
        <RouterLink to="/help" class="nav-item">
          <span class="nav-icon">❓</span>
          <span class="nav-text" v-if="!isSidebarCollapsed">帮助</span>
        </RouterLink>
      </nav>
      <div class="sidebar-toggle" @click="toggleSidebar">
        {{ isSidebarCollapsed ? '>' : '<' }}
      </div>
    </div>
    <div class="main-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 15%;
  height: 100%;
  background-color: #1E2A40;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
}

.sidebar.collapsed {
  width: 3%;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #4167B1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #DEF0F9;
  transition: opacity 0.3s ease;
}

.logo-icon {
  font-size: 20px;
  font-weight: bold;
  color: #DEF0F9;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4167B1;
  border-radius: 5px;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #DEF0F9;
  text-decoration: none;
  transition: background-color 0.3s;
  gap: 10px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px 10px;
}

.nav-icon {
  font-size: 16px;
  min-width: 20px;
  text-align: center;
}

.nav-text {
  transition: opacity 0.3s ease;
}

.sidebar.collapsed .nav-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(65, 103, 177, 0.6);
}

.nav-item.router-link-active {
  background: rgba(65, 103, 177, 0.8);
  border-left: 3px solid #DEF0F9;
}

.sidebar-toggle {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: #4167B1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0 5px 5px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;
}

.sidebar-toggle:hover {
  background-color: #1B1F23;
}

.main-content {
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: #DEF0F9;
  transition: margin-left 0.3s ease;
}

</style>
