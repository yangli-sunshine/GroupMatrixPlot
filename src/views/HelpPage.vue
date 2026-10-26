<script setup>
</script>

<template>
  <div class="help-page">
    <div class="help-content">
      <h1>帮助</h1>
      <div class="help-section">
        <h2>数据上传</h2>
        <p>可选择数据源（示例数据或上传文件）上传数据文件</p>
        <ul>
          <li>当选择示例数据时，下方上传文件输入框被锁定，点击生成图表即可在右侧相应页面预览示例数据及其绘制生成的图表。</li>
          <li>当选择上传文件时，点击"选择文件"按钮选择要上传的数据文件，点击下方生成图表即可在右侧相应页面预览上传数据及其绘制生成的图表。</li>
        </ul>
      </div>
      
      <div class="help-section">
        <h2>图表管理</h2>
        <p>可以对上传的数据生成的图表在图表预览界面进行以下操作：</p>
        <ul>
          <li><strong>颜色设置</strong>：在左侧的设置面板部分调整图表中符号、文字、分类列及边框的颜色。</li>
          <li><strong>大小设置</strong>：在左侧的设置面板部分调整符号大小、字体大小、边框大小及图表大小。</li>
          <li><strong>字体设置</strong>：在左侧的设置面板部分调整各种文本的字体样式和内容。</li>
          <li><strong>附加设置</strong>：在左侧的设置面板部分调整分隔线样式及图表内符号样式。</li>
          <li><strong>导出图表</strong>：点击图表预览界面左上方"导出图表"按钮将图表导出为SVG或PDF格式。</li>
        </ul>
      </div>
      
      <div class="help-section">
        <h2>数据管理</h2>
        <p>可以对上传的数据在数据预览界面进行以下操作：</p>
        <ul>
          <li>点击"下载示例数据"按钮下载示例数据文件。</li>
          <li><strong>搜索</strong>：通过搜索框搜索表格中的数据。</li>
          <li><strong>分页</strong>：通过分页控件查看表格中的数据。</li>
          <li><strong>显示</strong>：通过每页显示数据量调整表格中显示的数据量，默认显示10条。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-page {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #DEF0F9;
}

.help-content {
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
  margin-bottom: 30px;
  text-align: center;
}

h2 {
  color: #1B1F23;
  font-size: 20px;
  margin-top: 30px;
  margin-bottom: 15px;
  border-left: 4px solid #4167B1;
  padding-left: 10px;
}

.help-section {
  margin-bottom: 30px;
}

p {
  font-size: 16px;
  line-height: 1.6;
  color: #1B1F23;
  margin-bottom: 10px;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
  margin-bottom: 20px;
}

ul li {
  margin-bottom: 8px;
  color: #1B1F23;
  line-height: 1.5;
}
</style>