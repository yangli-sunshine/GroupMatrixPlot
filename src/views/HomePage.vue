<script setup>
</script>

<template>
  <div class="home-page">
    <div class="home-content">
      <h1>欢迎使用 Grouped Matrix Plotting Tool！</h1>
      <p class="intro-text">
       Grouped Matrix Plotting Tool是一款分类矩阵绘图工具，用于可视化多种分类数据。
      </p> 
         <div class="home-image">
        <img 
          src="../assets/eg5.png"
          alt="基因组测序数据可视化矩阵图" 
          class="tool-image"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #DEF0F9;
}

.home-content {
  max-width: 80%;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #4167B1;
  font-size: 28px;
  margin-bottom: 20px;
}

h2 {
  color: #1B1F23;
  font-size: 20px;
  margin-top: 20px;
  margin-bottom: 15px;
}

.intro-text {
  font-size: 20px;
  line-height: 1.6;
  color: #1B1F23;
  margin-bottom: 20px;
}

.feature-list {
  list-style-type: disc;
  padding-left: 20px;
  margin-bottom: 20px;
}

.feature-list li {
  margin-bottom: 8px;
  color: #1B1F23;
}

.usage-steps {
  list-style-type: decimal;
  padding-left: 20px;
  margin-bottom: 20px;
}

.usage-steps li {
  margin-bottom: 8px;
  color: #1B1F23;
}

.tool-image {
  max-width: 60%; /* 调整为你想要的宽度，例如 80% */
  height: auto; /* 保持宽高比 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

</style>