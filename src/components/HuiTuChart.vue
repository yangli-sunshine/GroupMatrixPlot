<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
const svgContainer = ref(null)
const activeTab = ref('matrix')
const chartGenerated = ref(false)
const showModal = ref(false)
const modalMessage = ref('')
function openModal(message) {
  modalMessage.value = message
  showModal.value = true
}
function closeModal() {
  showModal.value = false
}
const dataSource = ref('demo')
const selectedFile = ref('')
const uploadedData = ref(null)
const uploadedXAxis = ref([]) 
const uploadedYAxis = ref([]) 
const groupByColumn = ref('Group') 
watch(groupByColumn, (newGroupBy) => {
  if (uploadedYAxis.value.length > 0) {
    generateDynamicTypeConfig(uploadedYAxis.value, newGroupBy)
  }
})
function getCurrentGroups() {
  if (dataSource.value === 'upload') {
    return Object.entries(dynamicGroupConfig.value).map(([groupName, config]) => ({
      value: groupName,
      label: config.label,
      color: config.color
    }))
  } else {
    if (groupByColumn.value === 'Group') {
      return Y_AXIS_GROUP_DATA
    } else {
      const groupedViruses = {} 
      const allViruses = Y_AXIS_GROUP_DATA.flatMap(group => group.children) 
      allViruses.forEach((virusName, virusIndex) => {
        const categoryIndex = X_AXIS_CATEGORIES.indexOf(groupByColumn.value)
        let groupName = 'Unclassified' 
        if (categoryIndex !== -1 && VIRUS_MATRIX_DATA[virusIndex] && VIRUS_MATRIX_DATA[virusIndex][categoryIndex]) {
          groupName = VIRUS_MATRIX_DATA[virusIndex][categoryIndex]
        }
        if (!groupedViruses[groupName]) {
          groupedViruses[groupName] = []
        }
        groupedViruses[groupName].push(virusName)
      })
      return Object.entries(groupedViruses).map(([groupName, viruses], index) => ({
        value: groupName,
        label: groupName,
        children: viruses,
        color: GROUP_COLOR_LIST[index % GROUP_COLOR_LIST.length]
      }))
    }
  }
}
watch(dataSource, (newDataSource) => {
  if (newDataSource === 'demo') {
    groupByColumn.value = 'Group'
  } else if (uploadedXAxis.value.length > 1) {
    groupByColumn.value = uploadedXAxis.value[1]
  }
})
const currentPage = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const showHelpModal = ref(false)
const collapsedModules = ref({
  upload: false,
  group: false,
  color: true,
  colorInner: true,
  textColor: true,
  groupColor: true,
  borderColor: true,
  size: true,
  fontSize: true,
  borderSize: true,
  symbolSize: true,
  chartSize: true,
  font: true,
  titleSettings: true,
  xAxisTitleSettings: true,
  yAxisTitleSettings: true,
  lineStyleSettings: true,
  symbolStyleSettings: true,
  extra: true
})
const colorSettings = ref({
  knownColor: '#FFC9F2',
  annotatedColor: '#B8ECFF',
  notAnnotatedColor: '#B6FCBF'
})
const chartSizeSettings = ref({
  chartWidth: 750,
  chartHeight: 620,
  groupLabelWidth: 120,
  userModifiedHeight: false,
  userModifiedWidth: false
})
const textColorSettings = ref({
  titleColor: '#000000',
  xAxisTitleColor: '#000000',
  yAxisTitleColor: '#000000',
  xAxisTextColor: '#140000',
  firstColumnTextColor: '#140000'
})
const groupColorSettings = ref({
  Group1: '#7dd0c0',
  Group2: '#fff299',
  Group3: '#c4c0e0',
  Group4: '#f88880',
  Group5: '#82b8d8',
  Group6: '#f9bc78',
  Group7: '#b0e888'
})
const borderColorSettings = ref({
  pointBorderColor: '#000000',
  rowSeparatorColor: '#D0D7DE',
  columnSeparatorColor: '#D0D7DE',
  chartBorderColor: '#D0D7DE'
})
const fontSizeSettings = ref({
  titleFontSize: 25,
  xAxisTitleFontSize: 18,
  yAxisTitleFontSize: 18,
  axisTextFontSize: 13,
  firstColumnFontSize: 13
})
const borderSizeSettings = ref({
  pointBorderWidth: 1,
  rowSeparatorWidth: 1.5,
  columnSeparatorWidth: 1.5,
  chartBorderWidth: 1.5
})
const symbolSizeSettings = ref({
  knownSize: 6,
  annotatedSize: 6,
  notAnnotatedSize: 6
})
const titleSettings = ref({
  fontFamily: 'Arial',
  fontWeight: 'normal',
  textAlign: 'center'
})
const titleText = ref('Grouped Matrix Plot')
const xAxisTitleSettings = ref({
  fontFamily: 'Arial',
  textAlign: 'center'
})
const xAxisTitleContent = ref('Gene Segments')
const xAxisTextSettings = ref({
  fontFamily: 'Arial'
})
const yAxisTitleSettings = ref({
  fontFamily: 'Arial',
  textAlign: 'middle'
})
const yAxisTitleContent = ref('Virus')
const yAxisTextSettings = ref({
  fontFamily: 'Arial'
})
const lineStyleSettings = ref({
  rowSeparatorStyle: 'dashed',
  columnSeparatorStyle: 'dashed',
  borderLineStyle: 'solid'
})
const symbolStyleSettings = ref({
  knownSymbol: 'circle',
  annotatedSymbol: 'square',
  notAnnotatedSymbol: 'star'
})
const TYPE_CONFIG = {
  Known: {
    name: 'Known',
    symbol: 'star',
    color: colorSettings.value.knownColor,
    label: 'Known'
  },
  Novel_Annotated: {
    name: 'Novel(Annotated)',
    symbol: 'square',
    color: colorSettings.value.annotatedColor,
    label: 'Novel (Annotated)'
  },
  Novel_Not_Annotated: {
    name: 'Novel(Not annotated)',
    symbol: 'circle',
    color: colorSettings.value.notAnnotatedColor,
    label: 'Novel (Not annotated)'
  }
}
const dynamicTypeConfig = ref({})
const dynamicGroupConfig = ref({})
const SYMBOL_TYPES = ['circle', 'square', 'star', 'triangle', 'triangle-down', 'diamond']
const SYMBOL_NAMES = {
  circle: '○',
  square: '▢',
  star: '✩',
  triangle: '△',
  'triangle-down': '▽',
  diamond: '◇'
}
const COLOR_LIST = [
  '#d6eaff', '#d9f7be', '#fff1b3', '#ffccc7',
  '#e9d5ff', '#ffdaee', '#bae7ff', '#ffe58f',
  '#d9f7be', '#ffd4b8', '#d9f7be', '#ffe7b3'
]
const GROUP_COLOR_LIST = [
  '#b8f0e8', '#fff9cc', '#ded8f0', '#ffd6d6',
  '#c4e4f4', '#ffe4c4', '#d4f4d4', '#ffe4f2',
  '#d6f3ff', '#d6ffeb', '#ffe8cc', '#ffd6d6'
]
const X_AXIS_CATEGORIES = ['Seg1', 'Seg2', 'Seg3', 'Seg4', 'Seg5', 'Seg6', 'Seg7', 'Seg8']
const Y_AXIS_GROUP_DATA = [
  {
    value: 'Group1',
    color: groupColorSettings.value.Group1, 
    children: [
      'Virus 24',
      'Virus 4',
      'Virus 8'
    ]
  },
  {
    value: 'Group2',
    color: groupColorSettings.value.Group2,
    children: [
      'Virus 1',
      'Virus 9'
    ]
  },
  {
    value: 'Group3',
    color: groupColorSettings.value.Group3,
    children: [
      'Virus 16',
      'Virus 2',
      'Virus 3',
      'Virus 14',
      'Virus 12'
    ]
  },
  {
    value: 'Group4',
    color: groupColorSettings.value.Group4, 
    children: [
      'Virus 5'
    ]
  },
  {
    value: 'Group5',
    color: groupColorSettings.value.Group5,
    children: [
      'Virus 10',
      'Virus 17',
      'Virus 9',
      'Virus 6',
    ]
  },
  {
    value: 'Group6',
    color: groupColorSettings.value.Group6,   
    children: [
      'Virus 7',
      'Virus 13',
      'Virus 15',
      'Virus 19',
      'Virus 22',
      'Virus 26',
      'Virus 20'
    ]
  },
]
const VIRUS_MATRIX_DATA = [
  ['Known', 'Novel_Not_Annotated', 'Novel_Annotated', 'Known', 'Novel_Annotated', 'Known', 'Novel_Not_Annotated', 'Novel_Annotated'],
  ['Novel_Annotated', 'Known', '', 'Known', 'Known', 'Novel_Not_Annotated', 'Novel_Annotated', 'Known'],
  ['', 'Novel_Annotated', 'Novel_Not_Annotated', 'Novel_Annotated', 'Novel_Annotated', 'Novel_Annotated', 'Novel_Annotated', 'Known'],
  ['Novel_Not_Annotated', '', 'Novel_Not_Annotated', 'Known', 'Novel_Annotated', 'Known', '', 'Novel_Annotated'],
  ['Novel_Annotated', 'Known', '', 'Novel_Not_Annotated', 'Novel_Annotated', 'Novel_Annotated', 'Novel_Annotated', 'Known'],
  ['Known', 'Known', 'Novel_Not_Annotated', 'Novel_Annotated', 'Known', 'Novel_Annotated', '', 'Novel_Annotated'],
  ['Known', 'Novel_Annotated', 'Known', 'Novel_Annotated', 'Known', 'Novel_Not_Annotated', '', 'Known'],
  ['Novel_Not_Annotated', 'Known', '', 'Novel_Annotated', 'Novel_Annotated', 'Novel_Not_Annotated', 'Novel_Not_Annotated', ''],
  ['Novel_Annotated', 'Known', '', 'Novel_Not_Annotated', 'Known', 'Novel_Annotated', 'Known', 'Novel_Annotated'],
  ['Known', 'Novel_Annotated', 'Novel_Annotated', 'Known', 'Novel_Annotated', 'Known', '', 'Novel_Not_Annotated'],
  ['Novel_Not_Annotated', 'Novel_Annotated', 'Known', '', '', 'Known', 'Novel_Not_Annotated', 'Known'],
  ['', 'Known', 'Known', 'Novel_Not_Annotated', 'Novel_Not_Annotated', 'Novel_Annotated', 'Known', 'Novel_Annotated'],
  ['Novel_Not_Annotated', 'Novel_Annotated', 'Known', 'Novel_Not_Annotated', 'Novel_Not_Annotated', '', 'Known', ''],
  ['', 'Known', 'Novel_Annotated', 'Novel_Not_Annotated', 'Novel_Not_Annotated', 'Known', '', 'Novel_Annotated'],
  ['Known', '', 'Novel_Annotated', 'Novel_Annotated', 'Known', 'Novel_Annotated', '', 'Novel_Not_Annotated'],
  ['', 'Novel_Not_Annotated', '', 'Known', 'Novel_Annotated', 'Novel_Not_Annotated', 'Novel_Annotated', 'Known'],
  ['Novel_Annotated', '', 'Known', 'Novel_Annotated', '', 'Novel_Not_Annotated', 'Known', 'Novel_Not_Annotated'],
  ['', 'Novel_Annotated', 'Novel_Not_Annotated', 'Known', 'Known', 'Novel_Annotated', '', ''],
  ['Known', 'Known', 'Novel_Not_Annotated', 'Novel_Annotated', '', '', 'Known', 'Novel_Annotated'],
  ['Novel_Not_Annotated', '', '', 'Known', 'Novel_Not_Annotated', 'Known', '', ''],
  ['Novel_Annotated', 'Known', 'Novel_Annotated', 'Novel_Not_Annotated', '', 'Novel_Not_Annotated', 'Known', ''],
  ['Novel_Annotated', 'Known', '', '', 'Known', '', 'Novel_Annotated', 'Novel_Not_Annotated']
]
const config = {
  titleText: titleText.value,
  titleFontSize: 25,
  titleColor: '#000000',
  titleAlign:  titleSettings.value.textAlign,
  titleFontFamily: titleSettings.value.fontFamily,
  titleFontWeight: titleSettings.value.fontWeight,
  xAxisTitle: xAxisTitleContent.value,
  xAxisTitleFontSize: 18,
  xAxisTitleColor: '#000000',
  xAxisTitleFontFamily: xAxisTitleSettings.value.fontFamily,
  xAxisTitleAlign: xAxisTitleSettings.value.textAlign,
  yAxisTitle: yAxisTitleContent.value,
  yAxisTitleFontSize: 18,
  yAxisTitleColor: '#000000',
  yAxisTitleFontFamily: yAxisTitleSettings.value.fontFamily,
  yAxisTitleAlign: yAxisTitleSettings.value.textAlign,
  axisTextFontSize: 13,
  axisTextColor: '#140000',
  axisTextFontFamily: xAxisTextSettings.value.fontFamily,
  firstColumnFontFamily: yAxisTextSettings.value.fontFamily,
  KnownSize: symbolSizeSettings.value.knownSize,
  NovelAnnotatedSize: symbolSizeSettings.value.annotatedSize,
  NovelNotAnnotatedSize: symbolSizeSettings.value.notAnnotatedSize,
  pointBorderColor: '#000000',
  pointBorderWidth: 1,
  separatorColor: '#000000',
  separatorWidth: 1,
  separatorStyle: lineStyleSettings.value.rowSeparatorStyle,
  columnSeparatorStyle: lineStyleSettings.value.columnSeparatorStyle,
  borderLineStyle: lineStyleSettings.value.borderLineStyle,
  cellWidth: 30,
  cellHeight: 25,
  groupLabelWidth: 250,
  groupColorBarWidth: 10,
  leftMargin: 60,
  topMargin: 60,
  rightMargin: 250,
  bottomMargin: 60,
  groupGap: 5,
  categoryLegendWidth: 120,
  categoryLegendTitle: 'Category description',
  categoryLegendItemHeight: 25
}
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
const debouncedHandleResize = debounce(() => {
  if (chartGenerated.value && activeTab.value === 'matrix') {
    renderChart()
  }
}, 200)
onMounted(() => {
  window.addEventListener('resize', debouncedHandleResize)
  leftPanelWidth.value = calculateDefaultWidth()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', debouncedHandleResize)
  clearTimeout(debouncedHandleResize.timeout)
})
function handleResize() {
  debouncedHandleResize()
}
function switchTab(tabName) {
  activeTab.value = tabName
  if (tabName === 'matrix' && chartGenerated.value) {
    setTimeout(() => renderChart(), 100)
  }
}
function exportChart() {
  const svg = svgContainer.value?.querySelector('svg')
  if (!svg) {
    alert('没有可导出的图表')
    return
  }
  const svgData = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.svg'
  a.click()
  URL.revokeObjectURL(url)
}
function exportChartAsSVG() {
  const svg = svgContainer.value?.querySelector('svg')
  if (!svg) {
    alert('没有可导出的图表')
    return
  }
  const svgData = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.svg'
  a.click()
  URL.revokeObjectURL(url)
}
function exportChartAsPDF() {
  const svg = svgContainer.value?.querySelector('svg')
  if (!svg) {
    alert('没有可导出的图表')
    return
  }
  const svgData = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  img.onload = function() {
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    let imgWidth = pdfWidth - 20 
    let imgHeight = (imgWidth * canvas.height) / canvas.width
    if (imgHeight > pdfHeight - 20) { 
      imgHeight = pdfHeight - 20
      imgWidth = (imgHeight * canvas.width) / canvas.height
    }
    const x = (pdfWidth - imgWidth) / 2
    const y = (pdfHeight - imgHeight) / 2
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
    pdf.save('chart.pdf')
    URL.revokeObjectURL(url)
  }
  img.src = url
}
function getVirusCount() {
  if (dataSource.value === 'upload' && uploadedData.value) {
    return uploadedData.value.length
  }
  return Y_AXIS_GROUP_DATA.flatMap(g => g.children).length
}
function getSegmentCount() {
  if (dataSource.value === 'upload' && uploadedXAxis.value.length > 0) {
    return uploadedXAxis.value.length
  }
  return X_AXIS_CATEGORIES.length
}
function getDataPointCount() {
  if (dataSource.value === 'upload' && uploadedData.value && uploadedXAxis.value.length > 0) {
    return uploadedData.value.length * uploadedXAxis.value.length
  }
  let count = 0
  VIRUS_MATRIX_DATA.forEach(row => {
    row.forEach(cell => {
      if (cell) count++
    })
  })
  return count
}
function getTypeLabel(typeKey) {
  if (typeKey === 'Known') return 'Known'
  if (typeKey === 'Novel_Annotated') return 'Novel (Annotated)'
  if (typeKey === 'Novel_Not_Annotated') return 'Novel (Not annotated)'
  return '-'
}
function getTypeClass(typeKey) {
  if (typeKey === 'Known') return 'type-Known'
  if (typeKey === 'Novel_Annotated') return 'type-NovelAnnotated'
  if (typeKey === 'Novel_Not_Annotated') return 'type-NovelNotAnnotated'
  return 'type-empty'
}
function getVirusIndex(group, virusIndex) {
  let index = 0
  for (const g of Y_AXIS_GROUP_DATA) {
    if (g.value === group.value) {
      return index + virusIndex
    }
    index += g.children.length
  }
  return 0
}
function generateChart() {
  if (dataSource.value === 'upload' && (!uploadedYAxis.value || uploadedYAxis.value.length === 0)) {
    openModal('请先上传数据文件')
    return
  }
  chartSizeSettings.value.userModifiedHeight = false
  chartSizeSettings.value.userModifiedWidth = false
  chartGenerated.value = true
  activeTab.value = 'matrix' 
  setTimeout(() => {
    renderChart()
  }, 100)
}
function handleChartHeightChange() {
  chartSizeSettings.value.userModifiedHeight = true
  renderChart()
}
function handleChartWidthChange() {
  chartSizeSettings.value.userModifiedWidth = true
  renderChart()
}
function downloadSampleData() {
  let csvContent = 'Virus Name,Class,' + X_AXIS_CATEGORIES.join(',') + '\n'
  let virusIndex = 0
  Y_AXIS_GROUP_DATA.forEach(group => {
    group.children.forEach(virusName => {
      const rowData = VIRUS_MATRIX_DATA[virusIndex] || []
      const rowValues = rowData.map(value => value || '')
      csvContent += virusName + ',' + group.value + ',' + rowValues.join(',') + '\n'
      virusIndex++
    })
  })
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'example_data.csv')
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
function getFilteredData() {
  let data = []
  if (dataSource.value === 'upload' && uploadedYAxis.value.length > 0) {
    data = uploadedYAxis.value
  } else {
    data = Y_AXIS_GROUP_DATA.flatMap(group => 
      group.children.map(virusName => ({ name: virusName, group: group.label }))
    )
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    data = data.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }
  return data
}
function getTotalPages() {
  const filteredData = getFilteredData()
  return Math.ceil(filteredData.length / itemsPerPage.value)
}
function getCurrentPageData() {
  const filteredData = getFilteredData()
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredData.slice(startIndex, endIndex)
}
function goToPage(page) {
  const totalPages = getTotalPages()
  if (page >= 1 && page <= totalPages) {
    currentPage.value = page
  }
}
function goToPreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
function goToNextPage() {
  const totalPages = getTotalPages()
  if (currentPage.value < totalPages) {
    currentPage.value++
  }
}
function onItemsPerPageChange() {
  currentPage.value = 1
}
function onSearchChange() {
  currentPage.value = 1
}
const leftPanelWidth = ref(300)
const isResizing = ref(false)
function calculateDefaultWidth() {
  const screenWidth = window.innerWidth
  const calculatedWidth = Math.floor(screenWidth * 0.2)
  return Math.max(200, Math.min(800, calculatedWidth))
}
onMounted(() => {
  leftPanelWidth.value = calculateDefaultWidth()
  window.addEventListener('resize', debouncedHandleResize)
})
function startResize(e) {
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  const startX = e.clientX
  const startWidth = leftPanelWidth.value
  function handleMouseMove(e) {
    if (!isResizing.value) return
    const deltaX = e.clientX - startX
    const newWidth = Math.max(200, Math.min(800, startWidth + deltaX))
    leftPanelWidth.value = newWidth
  }
  function handleMouseUp() {
    isResizing.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
function showResizeCursor(e) {
  if (!isResizing.value) {
    e.target.style.cursor = 'col-resize'
  }
}
function hideResizeCursor(e) {
  if (!isResizing.value) {
    e.target.style.cursor = ''
  }
}
function getVirusData(virusName, category) {
  const virusIndex = Y_AXIS_GROUP_DATA.flatMap(g => g.children).indexOf(virusName)
  if (virusIndex === -1) return null
  const categoryIndex = X_AXIS_CATEGORIES.indexOf(category)
  if (categoryIndex === -1) return null
  return VIRUS_MATRIX_DATA[virusIndex][categoryIndex]
}
function getVirusGroup(virusName) {
  if (dataSource.value === 'upload' && uploadedYAxis.value.length > 0) {
    const virusData = uploadedYAxis.value.find(virus => virus.name === virusName)
    if (virusData && virusData.data[groupByColumn.value]) {
      return virusData.data[groupByColumn.value]
    }
    return 'Unclassified'
  }
  for (const group of Y_AXIS_GROUP_DATA) {
    if (group.children.includes(virusName)) {
      return group.value
    }
  }
  return 'Unclassified'
}
function toggleModule(moduleName) {
  collapsedModules.value[moduleName] = !collapsedModules.value[moduleName]
}
function handleFileSelect(event) {
  console.log('handleFileSelect called')
  if (event.target.files && event.target.files.length > 0) {
    const file = event.target.files[0]
    selectedFile.value = file.name
    console.log('File selected:', file.name)
    dataSource.value = 'upload'
    chartGenerated.value = false
    console.log('dataSource set to:', dataSource.value)
    console.log('chartGenerated set to:', chartGenerated.value)
    const reader = new FileReader()
    reader.onload = function(e) {
      console.log('FileReader onload triggered')
      try {
        if (file.name.endsWith('.csv')) {
          const content = e.target.result
          console.log('Parsing CSV file')
          parseCSV(content)
        } else if (file.name.endsWith('.json')) {
          const content = e.target.result
          console.log('Parsing JSON file')
          parseJSON(content)
        } else if (file.name.endsWith('.xlsx')) {
          const data = new Uint8Array(e.target.result)
          console.log('Parsing XLSX file')
          parseXLSX(data)
        } else {
          alert('不支持的文件格式，请上传CSV、JSON或XLSX文件')
        }
      } catch (error) {
        console.error('文件解析错误:', error)
        alert('文件解析失败，请检查文件格式和内容')
      }
    }
    reader.onerror = function() {
      console.error('文件读取失败')
      alert('文件读取失败，请重试')
    }
    if (file.name.endsWith('.xlsx')) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  } else {
    selectedFile.value = ''
    uploadedData.value = null
    uploadedXAxis.value = []
    uploadedYAxis.value = []
  }
}
function parseCSV(content) {
  try {
    const lines = content.trim().split('\n')
    if (lines.length < 2) {
      alert('CSV文件至少需要两行数据')
      return
    }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    if (headers.length < 2) {
      alert('CSV文件至少需要两列数据')
      return
    }
    uploadedXAxis.value = headers
    if (uploadedXAxis.value.length > 1) {
      groupByColumn.value = uploadedXAxis.value[1]
    }
    const data = []
    let validRows = 0
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue 
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      if (values.length >= 1) {
        const virusName = values[0]
        if (!virusName) continue 
        const virusData = {}
        for (let j = 1; j < values.length && j < headers.length; j++) {
          const value = values[j]
          virusData[headers[j]] = (value === '-' || value === '') ? '' : value
        }
        data.push({ name: virusName, data: virusData })
        validRows++
      }
    }
    if (validRows === 0) {
      alert('CSV文件中没有有效的数据行')
      return
    }
    uploadedYAxis.value = data
    uploadedData.value = data
    console.log('解析CSV数据成功:', data)
    console.log('CSV - uploadedXAxis:', uploadedXAxis.value)
    console.log('CSV - uploadedYAxis:', uploadedYAxis.value)
    if (uploadedXAxis.value.length > 0) {
      updateChartTitles(selectedFile.value, groupByColumn.value, headers[0])
    }
    generateDynamicTypeConfig(data, groupByColumn.value)
  } catch (error) {
    console.error('CSV解析错误:', error)
    alert('CSV文件解析失败，请检查文件格式')
  }
}
function parseJSON(content) {
  try {
    const data = JSON.parse(content)
    if (Array.isArray(data) && data.length > 0) {
      const allKeys = new Set()
      data.forEach(item => {
        if (item.name && typeof item.data === 'object' && item.data !== null) {
          Object.keys(item.data).forEach(key => allKeys.add(key))
        }
      })
      const dataKeys = Array.from(allKeys)
      if (dataKeys.length === 0) {
        alert('JSON数据中没有有效的分组列')
        return
      }
      const processedData = data.map(item => {
        const processedData = {}
        dataKeys.forEach(key => {
          const value = item.data && item.data[key]
          const processedValue = (value === '-' || value === '' || value === null || value === undefined) ? '' : String(value).trim()
          processedData[key] = processedValue
        })
        return { name: item.name, data: processedData }
      })
      uploadedYAxis.value = processedData
      uploadedXAxis.value = dataKeys
      if (uploadedXAxis.value.length > 0) {
        groupByColumn.value = uploadedXAxis.value[0]
      }
      uploadedData.value = processedData
      console.log('解析JSON数据成功:', processedData)
      console.log('JSON - uploadedXAxis:', uploadedXAxis.value)
      console.log('JSON - uploadedYAxis:', uploadedYAxis.value)
      console.log('JSON - dataSource:', dataSource.value)
      if (uploadedXAxis.value.length > 0) {
        updateChartTitles(selectedFile.value, groupByColumn.value, 'Name')
      }
      generateDynamicTypeConfig(processedData, groupByColumn.value)
    } else {
      alert('JSON文件必须包含非空数组数据')
    }
  } catch (error) {
    console.error('JSON解析错误:', error)
    alert('JSON文件解析失败，请检查文件格式')
  }
}
function parseXLSX(data) {
  try {
    const workbook = XLSX.read(data, { type: 'array' })
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      alert('XLSX文件中没有工作表')
      return
    }
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    if (jsonData.length < 2) {
      alert('XLSX文件至少需要两行数据')
      return
    }
    const headers = jsonData[0].map(h => String(h).trim().replace(/^"|"$/g, ''))
    if (headers.length < 2) {
      alert('XLSX文件至少需要两列数据')
      return
    }
    uploadedXAxis.value = headers
    if (uploadedXAxis.value.length > 1) {
      groupByColumn.value = uploadedXAxis.value[1]
    }
    const dataRows = []
    let validRows = 0
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (row && row.length >= 1) {
        const virusName = String(row[0]).trim().replace(/^"|"$/g, '')
        if (!virusName) continue 
        const virusData = {}
        for (let j = 1; j < headers.length && j < row.length; j++) {
          const rawValue = row[j]
          if (rawValue === undefined || rawValue === null) {
            virusData[headers[j]] = ''
          } else {
            const value = String(rawValue).trim().replace(/^"|"$/g, '')
            virusData[headers[j]] = (value === '-' || value === '') ? '' : value
          }
        }
        dataRows.push({ name: virusName, data: virusData })
        validRows++
      }
    }
    if (validRows === 0) {
      alert('XLSX文件中没有有效的数据行')
      return
    }
    uploadedYAxis.value = dataRows
    uploadedData.value = dataRows
    console.log('解析XLSX数据成功:', dataRows)
    console.log('XLSX - uploadedXAxis:', uploadedXAxis.value)
    console.log('XLSX - uploadedYAxis:', uploadedYAxis.value)
    console.log('XLSX - dataSource:', dataSource.value)
    if (uploadedXAxis.value.length > 0) {
      updateChartTitles(selectedFile.value, groupByColumn.value, headers[0])
    }
    generateDynamicTypeConfig(dataRows, groupByColumn.value)
  } catch (error) {
    console.error('XLSX解析错误:', error)
    alert('XLSX文件解析失败，请检查文件格式')
  }
}
function updateChartTitles(fileName, groupColumn, yAxisTitle) {
  titleText.value = fileName.replace(/\.[^/.]+$/, "")
  xAxisTitleContent.value = groupColumn
  yAxisTitleContent.value = yAxisTitle
  config.titleText = titleText.value
  config.xAxisTitle = xAxisTitleContent.value
  config.yAxisTitle = yAxisTitleContent.value
}
function generateDynamicTypeConfig(dataRows, groupBy = '') {
  const uniqueValues = new Set()
  const uniqueGroups = new Set()
  for (const row of dataRows) {
    for (const [key, value] of Object.entries(row.data)) {
      if (key !== groupBy) {
        const trimmedValue = value ? value.trim() : ''
        if (trimmedValue) {
          uniqueValues.add(trimmedValue)
        }
      }
    }
    if (groupBy && row.data[groupBy]) {
      uniqueGroups.add(row.data[groupBy].trim())
    } else {
      const nameParts = row.name.split(' ')
      if (nameParts.length > 0) {
        uniqueGroups.add(nameParts[0])
      }
    }
  }
  const valuesArray = Array.from(uniqueValues)
  const groupsArray = Array.from(uniqueGroups)
  const newTypeConfig = {}
  const newGroupConfig = {}
  const symbolTypesLength = SYMBOL_TYPES.length
  const colorListLength = COLOR_LIST.length
  const groupColorListLength = GROUP_COLOR_LIST.length
  for (let i = 0; i < valuesArray.length; i++) {
    const value = valuesArray[i]
    newTypeConfig[value] = {
      name: value,
      symbol: SYMBOL_TYPES[i % symbolTypesLength],
      color: COLOR_LIST[i % colorListLength],
      size: symbolSizeSettings.value.knownSize, 
      label: value
    }
  }
  for (let i = 0; i < groupsArray.length; i++) {
    const group = groupsArray[i]
    newGroupConfig[group] = {
      name: group,
      color: GROUP_COLOR_LIST[i % groupColorListLength],
      label: group
    }
  }
  dynamicTypeConfig.value = newTypeConfig
  dynamicGroupConfig.value = newGroupConfig
  console.log('生成动态类型配置:', newTypeConfig)
  console.log('生成动态分组配置:', newGroupConfig)
}
function updateChartColors() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const symbols = svg.querySelectorAll('[data-type]')
  symbols.forEach(symbol => {
    const type = symbol.getAttribute('data-type')
    if (dataSource.value === 'upload') {
      const typeConfig = dynamicTypeConfig.value[type]
      if (typeConfig) {
        symbol.setAttribute('fill', typeConfig.color)
      }
    } else {
      if (type === 'Known') {
        symbol.setAttribute('fill', colorSettings.value.knownColor)
      } else if (type === 'Novel_Annotated') {
        symbol.setAttribute('fill', colorSettings.value.annotatedColor)
      } else if (type === 'Novel_Not_Annotated') {
        symbol.setAttribute('fill', colorSettings.value.notAnnotatedColor)
      }
    }
  })
  TYPE_CONFIG.Known.color = colorSettings.value.knownColor
  TYPE_CONFIG.Novel_Annotated.color = colorSettings.value.annotatedColor
  TYPE_CONFIG.Novel_Not_Annotated.color = colorSettings.value.notAnnotatedColor
}
function updateDynamicColor(typeKey, event) {
  const newColor = event.target.value
  if (dynamicTypeConfig.value[typeKey]) {
    dynamicTypeConfig.value[typeKey].color = newColor
    updateChartColors()
  }
}
function updateTextColors() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const title = svg.querySelector('[data-text-type="title"]')
  if (title) {
    title.setAttribute('fill', textColorSettings.value.titleColor)
  }
  const xAxisTitle = svg.querySelector('[data-text-type="xAxisTitle"]')
  if (xAxisTitle) {
    xAxisTitle.setAttribute('fill', textColorSettings.value.xAxisTitleColor)
  }
  const yAxisTitle = svg.querySelector('[data-text-type="yAxisTitle"]')
  if (yAxisTitle) {
    yAxisTitle.setAttribute('fill', textColorSettings.value.yAxisTitleColor)
  }
  const xAxisTexts = svg.querySelectorAll('[data-text-type="xAxisText"]')
  xAxisTexts.forEach(text => {
    text.setAttribute('fill', textColorSettings.value.xAxisTextColor)
  })
  const firstColumnTexts = svg.querySelectorAll('[data-text-type="firstColumn"]')
  firstColumnTexts.forEach(text => {
    text.setAttribute('fill', textColorSettings.value.firstColumnTextColor)
  })
  config.titleColor = textColorSettings.value.titleColor
  config.xAxisTitleColor = textColorSettings.value.xAxisTitleColor
  config.yAxisTitleColor = textColorSettings.value.yAxisTitleColor
  config.axisTextColor = textColorSettings.value.xAxisTextColor
}
function updateFontSizes() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const title = svg.querySelector('[data-text-type="title"]')
  if (title) {
    title.setAttribute('font-size', fontSizeSettings.value.titleFontSize)
  }
  const xAxisTitle = svg.querySelector('[data-text-type="xAxisTitle"]')
  if (xAxisTitle) {
    xAxisTitle.setAttribute('font-size', fontSizeSettings.value.xAxisTitleFontSize)
  }
  const yAxisTitle = svg.querySelector('[data-text-type="yAxisTitle"]')
  if (yAxisTitle) {
    yAxisTitle.setAttribute('font-size', fontSizeSettings.value.yAxisTitleFontSize)
  }
  const xAxisTexts = svg.querySelectorAll('[data-text-type="xAxisText"]')
  xAxisTexts.forEach(text => {
    text.setAttribute('font-size', fontSizeSettings.value.axisTextFontSize)
  })
  const firstColumnTexts = svg.querySelectorAll('[data-text-type="firstColumn"]')
  firstColumnTexts.forEach(text => {
    text.setAttribute('font-size', fontSizeSettings.value.firstColumnFontSize)
  })
  config.titleFontSize = fontSizeSettings.value.titleFontSize
  config.xAxisTitleFontSize = fontSizeSettings.value.xAxisTitleFontSize
  config.yAxisTitleFontSize = fontSizeSettings.value.yAxisTitleFontSize
  config.axisTextFontSize = fontSizeSettings.value.axisTextFontSize
}
function updateBorderSizes() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const pointBorders = svg.querySelectorAll('[data-border-type="pointBorder"]')
  pointBorders.forEach(border => {
    border.setAttribute('stroke-width', borderSizeSettings.value.pointBorderWidth)
  })
  const rowLines = svg.querySelectorAll('[data-border-type="rowLine"]')
  rowLines.forEach(line => {
    line.setAttribute('stroke-width', borderSizeSettings.value.rowSeparatorWidth)
  })
  const columnLines = svg.querySelectorAll('[data-border-type="columnLine"]')
  columnLines.forEach(line => {
    line.setAttribute('stroke-width', borderSizeSettings.value.columnSeparatorWidth)
  })
  const chartBorders = svg.querySelectorAll('[data-border-type="chartBorder"]')
  chartBorders.forEach(border => {
    border.setAttribute('stroke-width', borderSizeSettings.value.chartBorderWidth)
  })
  config.pointBorderWidth = borderSizeSettings.value.pointBorderWidth
  config.separatorWidth = borderSizeSettings.value.rowSeparatorWidth
}
function updateSymbolSizes() {
  if (!chartGenerated.value) return
  config.KnownSize = symbolSizeSettings.value.knownSize
  config.NovelAnnotatedSize = symbolSizeSettings.value.annotatedSize
  config.NovelNotAnnotatedSize = symbolSizeSettings.value.notAnnotatedSize
  renderChart()
}
function updateDynamicSymbolSize(typeKey, event) {
  const newSize = parseInt(event.target.value)
  if (dynamicTypeConfig.value[typeKey]) {
    dynamicTypeConfig.value[typeKey].size = newSize
    renderChart()
  }
}
function updateTitleSettings() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const title = svg.querySelector('[data-text-type="title"]')
  if (title) {
    title.style.fontFamily = titleSettings.value.fontFamily
    title.style.fontWeight = titleSettings.value.fontWeight
    title.setAttribute('text-anchor', titleSettings.value.textAlign === 'center' ? 'middle' : titleSettings.value.textAlign)
    const width = parseFloat(svg.getAttribute('width')) || 800
    let titleX
    switch (titleSettings.value.textAlign) {
      case 'left':
        titleX = config.leftMargin
        break
      case 'right':
        titleX = width - config.rightMargin - 150 
        break
      case 'center':
      default:
        titleX = width / 2 - 50
        break
    }
    title.setAttribute('x', titleX)
  }
  config.titleFontFamily = titleSettings.value.fontFamily
  config.titleFontWeight = titleSettings.value.fontWeight
  config.titleAlign = titleSettings.value.textAlign
}
function updateTitleContent() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const title = svg.querySelector('[data-text-type="title"]')
  if (title) {
    title.textContent = titleText.value
    config.titleText = titleText.value
  }
}
function updateXAxisTitleSettings() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const xAxisTitle = svg.querySelector('[data-text-type="xAxisTitle"]')
  if (xAxisTitle) {
    xAxisTitle.style.fontFamily = xAxisTitleSettings.value.fontFamily
    xAxisTitle.setAttribute('text-anchor', xAxisTitleSettings.value.textAlign === 'center' ? 'middle' : xAxisTitleSettings.value.textAlign)
    const width = parseFloat(svg.getAttribute('width')) || 800
    let xAxisTitleX
    switch (xAxisTitleSettings.value.textAlign) {
      case 'left':
        xAxisTitleX = config.leftMargin
        break
      case 'right':
        xAxisTitleX = width - config.rightMargin + 40
        break
      case 'center':
      default:
        xAxisTitleX = width / 2 - 50
        break
    }
    xAxisTitle.setAttribute('x', xAxisTitleX)
  }
  config.xAxisTitleFontFamily = xAxisTitleSettings.value.fontFamily
  config.xAxisTitleAlign = xAxisTitleSettings.value.textAlign
}
function updateXAxisTitleContent() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const xAxisTitle = svg.querySelector('[data-text-type="xAxisTitle"]')
  if (xAxisTitle) {
    xAxisTitle.textContent = xAxisTitleContent.value
    config.xAxisTitle = xAxisTitleContent.value
  }
}
function updateXAxisTextSettings() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const xAxisTexts = svg.querySelectorAll('[data-text-type="xAxisText"]')
  xAxisTexts.forEach(text => {
    text.style.fontFamily = xAxisTextSettings.value.fontFamily
  })
  config.axisTextFontFamily = xAxisTextSettings.value.fontFamily
}
function updateYAxisTitleSettings() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const yTitleGroup = svg.querySelector('[data-title-group="yAxis"]');
  if (!yTitleGroup) return;
  const yAxisTitle = svg.querySelector('[data-text-type="yAxisTitle"]')
  if (yAxisTitle) {
    yAxisTitle.style.fontFamily = yAxisTitleSettings.value.fontFamily;
  }
  const FIXED_X = 25;
  const chartHeight = Y_AXIS_GROUP_DATA.flatMap(g => g.children).length * config.cellHeight;
  const chartTop = config.topMargin;
  const chartCenterY = chartTop + chartHeight / 2;
  const chartBottom = chartTop + chartHeight;
  let targetY;
  switch (yAxisTitleSettings.value.textAlign) {
    case 'top': targetY = chartTop; break;
    case 'bottom': targetY = chartBottom; break;
    default: targetY = chartCenterY; break;
  }
  yTitleGroup.setAttribute('transform', `translate(${FIXED_X}, ${targetY})`);
  config.yAxisTitleFontFamily = yAxisTitleSettings.value.fontFamily;
  config.yAxisTitleAlign = yAxisTitleSettings.value.textAlign;
}
function updateYAxisTitleContent() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const yAxisTitle = svg.querySelector('[data-text-type="yAxisTitle"]')
  if (yAxisTitle) {
    yAxisTitle.textContent = yAxisTitleContent.value
    config.yAxisTitle = yAxisTitleContent.value
  }
}
function updateYAxisTextSettings() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const yAxisTexts = svg.querySelectorAll('[data-text-type="firstColumn"]')
  yAxisTexts.forEach(text => {
    text.style.fontFamily = yAxisTextSettings.value.fontFamily
  })
  config.firstColumnFontFamily = yAxisTextSettings.value.fontFamily
}
function getColorSettingsKey(groupValue) {
  return groupValue.replace(/-/g, '').replace(/\s/g, '')
}
function updateGroupColors() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  if (dataSource.value === 'upload') {
    Object.entries(dynamicGroupConfig.value).forEach(([groupName, config]) => {
      const colorBars = svg.querySelectorAll(`[data-group-type="${groupName}"]`)
      colorBars.forEach(colorBar => {
        colorBar.setAttribute('fill', config.color)
      })
    })
  } else {
    if (groupByColumn.value === 'Group') {
      Y_AXIS_GROUP_DATA.forEach(group => {
        const colorKey = getColorSettingsKey(group.value)
        const colorBars = svg.querySelectorAll(`[data-group-type="${group.value}"]`)
        colorBars.forEach(colorBar => {
          colorBar.setAttribute('fill', groupColorSettings.value[colorKey])
        })
        group.color = groupColorSettings.value[colorKey]
      })
    } else {
      getCurrentGroups().forEach(group => {
        const colorBars = svg.querySelectorAll(`[data-group-type="${group.value}"]`)
        colorBars.forEach(colorBar => {
          colorBar.setAttribute('fill', dynamicGroupConfig.value[group.value]?.color || group.color)
        })
      })
    }
  }
}
function updateDynamicGroupColor(groupName, event) {
  const newColor = event.target.value
  if (dynamicGroupConfig.value[groupName]) {
    dynamicGroupConfig.value[groupName].color = newColor
  } else {
    dynamicGroupConfig.value[groupName] = {
      label: groupName,
      color: newColor
    }
  }
  updateGroupColors()
}
function updateBorderColors() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const pointBorders = svg.querySelectorAll('[data-border-type="pointBorder"]')
  pointBorders.forEach(border => {
    border.setAttribute('stroke', borderColorSettings.value.pointBorderColor)
  })
  const rowLines = svg.querySelectorAll('[data-border-type="rowLine"]')
  rowLines.forEach(line => {
    line.setAttribute('stroke', borderColorSettings.value.rowSeparatorColor)
  })
  const columnLines = svg.querySelectorAll('[data-border-type="columnLine"]')
  columnLines.forEach(line => {
    line.setAttribute('stroke', borderColorSettings.value.columnSeparatorColor)
  })
  const chartBorders = svg.querySelectorAll('[data-border-type="chartBorder"]')
  chartBorders.forEach(border => {
    border.setAttribute('stroke', borderColorSettings.value.chartBorderColor)
  })
  config.pointBorderColor = borderColorSettings.value.pointBorderColor
  config.separatorColor = borderColorSettings.value.rowSeparatorColor
}
function updateLineStyles() {
  if (!chartGenerated.value) return
  const container = svgContainer.value
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return
  const rowLines = svg.querySelectorAll('[data-border-type="rowLine"]')
  rowLines.forEach(line => {
    line.setAttribute('stroke-dasharray', getStrokeDashArray(lineStyleSettings.value.rowSeparatorStyle))
  })
  const columnLines = svg.querySelectorAll('[data-border-type="columnLine"]')
  columnLines.forEach(line => {
    line.setAttribute('stroke-dasharray', getStrokeDashArray(lineStyleSettings.value.columnSeparatorStyle))
  })
  const chartBorders = svg.querySelectorAll('[data-border-type="chartBorder"]')
  chartBorders.forEach(border => {
    border.setAttribute('stroke-dasharray', getStrokeDashArray(lineStyleSettings.value.borderLineStyle))
  })
  config.separatorStyle = lineStyleSettings.value.rowSeparatorStyle
  config.columnSeparatorStyle = lineStyleSettings.value.columnSeparatorStyle
  config.borderLineStyle = lineStyleSettings.value.borderLineStyle
  if (lineStyleSettings.value.rowSeparatorStyle === 'double' || 
      lineStyleSettings.value.columnSeparatorStyle === 'double' || 
      lineStyleSettings.value.borderLineStyle === 'double') {
    renderChart()
  }
}
function updateSymbolStyles() {
  if (!chartGenerated.value) return
  TYPE_CONFIG.Known.symbol = symbolStyleSettings.value.knownSymbol
  TYPE_CONFIG.Novel_Annotated.symbol = symbolStyleSettings.value.annotatedSymbol
  TYPE_CONFIG.Novel_Not_Annotated.symbol = symbolStyleSettings.value.notAnnotatedSymbol
  renderChart()
}
function updateDynamicSymbol(typeKey, event) {
  if (!chartGenerated.value) return
  if (dynamicTypeConfig.value[typeKey]) {
    dynamicTypeConfig.value[typeKey].symbol = event.target.value
    renderChart()
  }
}
function getStrokeDashArray(style) {
  switch (style) {
    case 'solid':
      return 'none'
    case 'dashed':
      return '5,3'
    case 'dotted':
      return '2,2'
    case 'double':
      return '4,2,4,2'
    default:
      return 'none'
  }
}
function renderChart() {
  const container = svgContainer.value
  if (!container) return
  let allViruses = []
  let xAxisCategories = []
  console.log('renderChart - dataSource:', dataSource.value)
  console.log('renderChart - uploadedData:', uploadedData.value)
  console.log('renderChart - uploadedXAxis length:', uploadedXAxis.value.length)
  if (dataSource.value === 'upload' && uploadedData.value && uploadedXAxis.value.length > 0) {
    console.log('Using uploaded data')
    if (groupByColumn.value) {
      const groupedViruses = {}
      uploadedYAxis.value.forEach(virus => {
        const groupName = virus.data[groupByColumn.value] || 'Unclassified'
        if (!groupedViruses[groupName]) {
          groupedViruses[groupName] = []
        }
        groupedViruses[groupName].push(virus.name)
      })
      const groups = Object.entries(groupedViruses).map(([groupName, viruses]) => ({
        value: groupName,
        children: viruses
      }))
      groups.sort((a, b) => a.value.localeCompare(b.value))
      allViruses = groups.flatMap(group => group.children)
    } else {
      allViruses = uploadedYAxis.value.map(virus => virus.name)
    }
    xAxisCategories = uploadedXAxis.value.filter((category, index) => index !== 0 && category !== groupByColumn.value)
  } else {
    console.log('Using demo data')
    allViruses = Y_AXIS_GROUP_DATA.flatMap(group => group.children)
    xAxisCategories = X_AXIS_CATEGORIES.filter(category => category !== groupByColumn.value)
  }
  const numCols = xAxisCategories.length
  const numRows = allViruses.length
  let containerWidth = 1000
  let containerHeight = 1000
  if (container) {
    const rect = container.getBoundingClientRect()
    containerWidth = rect.width
    containerHeight = rect.height - 80 
  }
  const isInitialWidth = chartSizeSettings.value.chartWidth === 1000 && !chartSizeSettings.value.userModifiedWidth
  const isInitialHeight = chartSizeSettings.value.chartHeight === 650 && !chartSizeSettings.value.userModifiedHeight
  const defaultCellWidth = 30
  const defaultCellHeight = 25
  const minChartWidth = 200
  const minChartHeight = 600
  const maxChartWidth = containerWidth
  const maxChartHeight = containerHeight
  const calculatedWidth = chartSizeSettings.value.groupLabelWidth + (numCols * defaultCellWidth) + 350 
  const calculatedHeight = (numRows * defaultCellHeight) + 250 
  const autoWidth = Math.round(Math.max(minChartWidth, Math.min(maxChartWidth, calculatedWidth)))
  const autoHeight = Math.round(calculatedHeight)
  if (isInitialWidth && isInitialHeight) {
    chartSizeSettings.value.chartWidth = autoWidth
    chartSizeSettings.value.chartHeight = autoHeight
  } else if (isInitialWidth) {
    chartSizeSettings.value.chartWidth = autoWidth
  } else if (isInitialHeight) {
    chartSizeSettings.value.chartHeight = autoHeight
  }
  const totalWidth = chartSizeSettings.value.chartWidth
  const totalHeight = chartSizeSettings.value.chartHeight
  const tempConfig = {
    ...config,
    cellWidth: 30, 
    cellHeight: 25  
  }
  const availableWidth = totalWidth - tempConfig.leftMargin - tempConfig.rightMargin - chartSizeSettings.value.groupLabelWidth
  if (availableWidth > 0 && numCols > 0) {
    tempConfig.cellWidth = availableWidth / numCols
  }
  const availableHeight = totalHeight - tempConfig.topMargin - tempConfig.bottomMargin - 100 
  if (availableHeight > 0 && numRows > 0) {
    tempConfig.cellHeight = availableHeight / numRows
  }
  const svg = createSVGElement('svg', {
    width: totalWidth,
    height: totalHeight,
    viewBox: `0 0 ${totalWidth} ${totalHeight}`
  })
  const defs = createSVGElement('defs', {})
  svg.appendChild(defs)
  const style = createSVGElement('style', {
    textContent: `
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    `
  })
  svg.appendChild(style)
  drawTitle(svg, totalWidth, xAxisCategories, tempConfig)
  drawAxisTitles(svg, totalWidth, totalHeight, xAxisCategories, allViruses.length, tempConfig)
  drawGroupLabels(svg, allViruses, totalWidth, xAxisCategories.length, tempConfig)
  drawMatrix(svg, allViruses, xAxisCategories, numCols, numRows, tempConfig)
  drawColumnLabels(svg, xAxisCategories, numRows, tempConfig)
  drawLegend(svg, totalWidth, totalHeight, tempConfig)
  drawBorder(svg, allViruses, xAxisCategories.length, numRows, tempConfig)
  container.innerHTML = ''
  container.appendChild(svg)
}
function createSVGElement(tag, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag)
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      element.textContent = value
    } else {
      element.setAttribute(key, value)
    }
  })
  return element
}
function drawTitle(svg, width, xAxisCategories, config) {
  let titleX
  switch (config.titleAlign) {
    case 'left':
      titleX = config.leftMargin
      break
    case 'right':
      titleX = config.rightMargin 
      break
    case 'center':
    default:
      titleX = width / 2 - 50
      break
  }
  const title = createSVGElement('text', {
    x: titleX,
    y: 35,
    'text-anchor': config.titleAlign === 'center' ? 'middle' : config.titleAlign,
    'dominant-baseline': 'middle',
    fill: config.titleColor,
    'font-size': config.titleFontSize,
    'font-family': config.titleFontFamily,
    'font-weight': config.titleFontWeight,
    textContent: config.titleText,
    'data-text-type': 'title'
  })
  svg.appendChild(title)
}
function drawAxisTitles(svg, width, height, xAxisCategories, numRows, config) {
  let xAxisTitleX
  switch (config.xAxisTitleAlign) {
    case 'left':
      xAxisTitleX = config.leftMargin
      break
    case 'right':
      xAxisTitleX = width - config.rightMargin - 150 
      break
    case 'center':
    default:
      xAxisTitleX = width / 2
      break
  }
  const xAxisTitle = createSVGElement('text', {
    x: xAxisTitleX,
    y: height - 90,
    'text-anchor': config.xAxisTitleAlign === 'center' ? 'middle' : config.xAxisTitleAlign,
    'dominant-baseline': 'middle',
    fill: config.xAxisTitleColor,
    'font-size': config.xAxisTitleFontSize,
    'font-family': config.xAxisTitleFontFamily,
    'font-weight': 'bold',
    textContent: config.xAxisTitle,
    'data-text-type': 'xAxisTitle'
  })
  svg.appendChild(xAxisTitle)
  const FIXED_X = 25; 
  const chartHeight = numRows * config.cellHeight;
  const centerY = config.topMargin + chartHeight / 2;
  const yTitleGroup = createSVGElement('g', {
    transform: `translate(${FIXED_X}, ${centerY})`,
    'data-title-group': 'yAxis'
  });
  const yAxisTitle = createSVGElement('text', {
    x: 0,
    y: 0,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle', 
    fill: config.yAxisTitleColor,
    'font-size': config.yAxisTitleFontSize,
    'font-family': config.yAxisTitleFontFamily,
    'font-weight': 'bold',
    transform: 'rotate(-90)', 
    textContent: config.yAxisTitle,
    'data-text-type': 'yAxisTitle'
  });
  yTitleGroup.appendChild(yAxisTitle);
  svg.appendChild(yTitleGroup);
}
function drawGroupLabels(svg, allViruses, totalWidth, xAxisCategoriesLength, config) {
  let currentY = config.topMargin
  let groups = []
  if (dataSource.value === 'upload') {
    if (uploadedYAxis.value.length > 0) {
      const groupedViruses = {}
      uploadedYAxis.value.forEach(virus => {
        const groupName = virus.data[groupByColumn.value] || 'Unclassified'
        if (!groupedViruses[groupName]) {
          groupedViruses[groupName] = []
        }
        groupedViruses[groupName].push(virus.name)
      })
      groups = Object.entries(groupedViruses).map(([groupName, viruses]) => ({
        value: groupName,
        label: groupName,
        children: viruses,
        color: dynamicGroupConfig.value[groupName]?.color || '#4088E0'
      }))
    }
  } else {
    if (groupByColumn.value === 'Group') {
      groups = Y_AXIS_GROUP_DATA
    } else {
      const groupedViruses = {}
      const allViruses = Y_AXIS_GROUP_DATA.flatMap(group => group.children)
      allViruses.forEach((virusName, virusIndex) => {
        const categoryIndex = X_AXIS_CATEGORIES.indexOf(groupByColumn.value)
        let groupName = 'Unclassified'
        if (categoryIndex !== -1 && VIRUS_MATRIX_DATA[virusIndex] && VIRUS_MATRIX_DATA[virusIndex][categoryIndex]) {
          groupName = VIRUS_MATRIX_DATA[virusIndex][categoryIndex]
        }
        if (!groupedViruses[groupName]) {
          groupedViruses[groupName] = []
        }
        groupedViruses[groupName].push(virusName)
      })
      groups = Object.entries(groupedViruses).map(([groupName, viruses], index) => ({
        value: groupName,
        label: groupName,
        children: viruses,
        color: GROUP_COLOR_LIST[index % GROUP_COLOR_LIST.length]
      }))
    }
  }
  groups.forEach((group, groupIndex) => {
    const groupStartY = currentY
    const groupHeight = group.children.length * config.cellHeight
    const colorBar = createSVGElement('rect', {
      x: config.leftMargin,
      y: groupStartY,
      width: config.groupColorBarWidth,
      height: groupHeight,
      fill: group.color,
      opacity: 0.6,
      'data-group-type': group.value || 'upload'
    })
    svg.appendChild(colorBar)
    if (groupIndex > 0) {
      const contentWidth = chartSizeSettings.value.groupLabelWidth + xAxisCategoriesLength * config.cellWidth
      const separatorEndX = config.leftMargin + contentWidth
      if (config.separatorStyle === 'double') {
        const groupSeparator1 = createSVGElement('line', {
          x1: config.leftMargin,
          y1: groupStartY - 2,
          x2: separatorEndX,
          y2: groupStartY - 2,
          stroke: borderColorSettings.value.rowSeparatorColor,
          'stroke-width': borderSizeSettings.value.rowSeparatorWidth,
          'data-border-type': 'rowLine'
        })
        svg.appendChild(groupSeparator1)
        const groupSeparator2 = createSVGElement('line', {
          x1: config.leftMargin,
          y1: groupStartY + 2,
          x2: separatorEndX,
          y2: groupStartY + 2,
          stroke: borderColorSettings.value.rowSeparatorColor,
          'stroke-width': borderSizeSettings.value.rowSeparatorWidth,
          'data-border-type': 'rowLine'
        })
        svg.appendChild(groupSeparator2)
      } else {
        const groupSeparator = createSVGElement('line', {
          x1: config.leftMargin,
          y1: groupStartY,
          x2: separatorEndX,
          y2: groupStartY,
          stroke: borderColorSettings.value.rowSeparatorColor,
          'stroke-width': borderSizeSettings.value.rowSeparatorWidth,
          'stroke-dasharray': getStrokeDashArray(config.separatorStyle),
          'data-border-type': 'rowLine'
        })
        svg.appendChild(groupSeparator)
      }
    }
    group.children.forEach((virusName, index) => {
      const maxTextWidth = chartSizeSettings.value.groupLabelWidth - config.groupColorBarWidth 
      const textWidth = virusName.length * config.axisTextFontSize * 0.4
      const lineHeight = config.axisTextFontSize * 1.4
      const startY = groupStartY + (index + 1) * config.cellHeight - config.cellHeight / 2
      if (textWidth <= maxTextWidth) {
        const virusLabel = createSVGElement('text', {
          x: config.leftMargin + config.groupColorBarWidth + 10,
          y: startY,
          'text-anchor': 'start',
          'dominant-baseline': 'middle',
          fill: config.axisTextColor,
          'font-size': config.axisTextFontSize,
          'font-family': config.firstColumnFontFamily,
          textContent: virusName,
          'data-text-type': 'firstColumn'
        })
        svg.appendChild(virusLabel)
      } else {
        const avgCharWidth = config.axisTextFontSize * 0.4
        const charsPerLine = Math.floor(maxTextWidth / avgCharWidth)
        const lines = []
        for (let i = 0; i < virusName.length; i += charsPerLine) {
          lines.push(virusName.substring(i, i + charsPerLine))
        }
        const totalHeight = lines.length * lineHeight + (lines.length) * 2
        const firstLineY = startY - (totalHeight / 2) + (lineHeight / 2) 
        lines.forEach((line, lineIndex) => {
          const virusLabel = createSVGElement('text', {
            x: config.leftMargin + config.groupColorBarWidth + 10,
            y: firstLineY + lineIndex * lineHeight,
            'text-anchor': 'start',
            'dominant-baseline': 'middle',
            fill: config.axisTextColor,
            'font-size': config.axisTextFontSize,
            'font-family': config.firstColumnFontFamily,
            textContent: line,
            'data-text-type': 'firstColumn'
          })
          svg.appendChild(virusLabel)
        })
      }
    })
    currentY += groupHeight
  })
}
function drawMatrix(svg, allViruses, xAxisCategories, numCols, numRows, config) {
  const startX = config.leftMargin + chartSizeSettings.value.groupLabelWidth
  const startY = config.topMargin
  xAxisCategories.forEach((category, col) => {
    if (category === groupByColumn.value) return
    if (config.columnSeparatorStyle === 'double') {
      const separator1 = createSVGElement('line', {
        x1: startX + col * config.cellWidth - 2,
        y1: startY,
        x2: startX + col * config.cellWidth - 2,
        y2: startY + numRows * config.cellHeight,
        stroke: borderColorSettings.value.columnSeparatorColor,
        'stroke-width': borderSizeSettings.value.columnSeparatorWidth,
        'data-border-type': 'columnLine'
      })
      svg.appendChild(separator1)
      const separator2 = createSVGElement('line', {
        x1: startX + col * config.cellWidth + 2,
        y1: startY,
        x2: startX + col * config.cellWidth + 2,
        y2: startY + numRows * config.cellHeight ,
        stroke: borderColorSettings.value.columnSeparatorColor,
        'stroke-width': borderSizeSettings.value.columnSeparatorWidth,
        'data-border-type': 'columnLine'
      })
      svg.appendChild(separator2)
    } else {
      const separator = createSVGElement('line', {
        x1: startX + col * config.cellWidth,
        y1: startY,
        x2: startX + col * config.cellWidth,
        y2: startY + numRows * config.cellHeight + 2,
        stroke: borderColorSettings.value.columnSeparatorColor,
        'stroke-width': borderSizeSettings.value.columnSeparatorWidth,
        'stroke-dasharray': getStrokeDashArray(config.columnSeparatorStyle),
        'data-border-type': 'columnLine'
      })
      svg.appendChild(separator)
    }
  })
  for (let row = 0; row < numRows; row++) {
    const virusName = allViruses[row]
    console.log('drawMatrix - row:', row)
    console.log('drawMatrix - virusName:', virusName)
    console.log('drawMatrix - dataSource:', dataSource.value)
    console.log('drawMatrix - uploadedYAxis length:', uploadedYAxis.value.length)
    console.log('drawMatrix - uploadedYAxis[row]:', uploadedYAxis.value[row])
    if (dataSource.value === 'upload') {
      const virusData = uploadedYAxis.value.find(virus => virus.name === virusName)
      if (!virusData) {
        console.log('drawMatrix - virusData not found for virusName:', virusName)
        continue
      }
      console.log('drawMatrix - using uploaded data for virus:', virusName)
      console.log('drawMatrix - virusData:', virusData)
      xAxisCategories.forEach((category, col) => {
        if (category === groupByColumn.value) return
        const typeKey = virusData.data[category]
        console.log('drawMatrix - category:', category, 'typeKey:', typeKey)
        const trimmedTypeKey = typeKey ? typeKey.trim() : ''
        if (!trimmedTypeKey) return
        const typeConfig = dynamicTypeConfig.value[trimmedTypeKey] || TYPE_CONFIG[trimmedTypeKey]
        if (!typeConfig) {
          console.log('drawMatrix - typeConfig not found for trimmedTypeKey:', trimmedTypeKey)
          return
        }
        const centerX = startX + col * config.cellWidth + config.cellWidth / 2
        const centerY = startY + row * config.cellHeight + config.cellHeight / 2
        const symbolSize = typeConfig.size || 8
        const shape = createShape(centerX, centerY, symbolSize, typeConfig.symbol, typeConfig.color, trimmedTypeKey)
        svg.appendChild(shape)
      })
    } else {
      console.log('drawMatrix - using demo data for row:', row)
      const rowData = VIRUS_MATRIX_DATA[row]
      if (!rowData) continue
      xAxisCategories.forEach((category, colIndex) => {
        const originalIndex = X_AXIS_CATEGORIES.indexOf(category)
        if (originalIndex === -1) return
        let typeKey = rowData[originalIndex]
        if (!typeKey) return
        if (typeKey === 'Novel (Annotated)') {
          typeKey = 'Novel_Annotated'
        } else if (typeKey === 'Novel (Not annotated)') {
          typeKey = 'Novel_Not_Annotated'
        }
        const typeConfig = TYPE_CONFIG[typeKey]
        if (!typeConfig) return
        const centerX = startX + colIndex * config.cellWidth + config.cellWidth / 2
        const centerY = startY + row * config.cellHeight + config.cellHeight / 2
        let symbolSize
        switch (typeKey) {
          case 'Known':
            symbolSize = config.KnownSize
            break
          case 'Novel_Annotated':
            symbolSize = config.NovelAnnotatedSize  
            break
          case 'Novel_Not_Annotated':
            symbolSize = config.NovelNotAnnotatedSize 
            break
          default:
            symbolSize = 7
        }
        const shape = createShape(centerX, centerY, symbolSize, typeConfig.symbol, typeConfig.color, typeKey)
        svg.appendChild(shape)
      })
    }
  }
}
function drawColumnLabels(svg, xAxisCategories, numRows, config) {
  const startX = config.leftMargin + chartSizeSettings.value.groupLabelWidth
  const startY = config.topMargin + numRows * config.cellHeight + 30
  let visibleColumnIndex = 0
  xAxisCategories.forEach((label, index) => {
    if (label === groupByColumn.value) return
    const text = createSVGElement('text', {
      x: startX + visibleColumnIndex * config.cellWidth + config.cellWidth / 2,
      y: startY,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: config.axisTextColor,
      'font-size': config.axisTextFontSize,
      'font-family': config.axisTextFontFamily,
      textContent: label,
      'data-text-type': 'xAxisText',
      transform: `rotate(-90 ${startX + visibleColumnIndex * config.cellWidth + config.cellWidth / 2} ${startY})`
    })
    svg.appendChild(text)
    visibleColumnIndex++
  })
}
function drawLegend(svg, width, height, config) {
  const legendX = width - config.rightMargin + 15
  const legendY = config.topMargin +20
  const legendItemHeight = 25
  const legendItemWidth = 15
  const legendTitle = createSVGElement('text', {
    x: legendX,
    y: legendY - 10,
    'text-anchor': 'start',
    'dominant-baseline': 'middle',
    fill: '#000000',
    'font-size': 15,
    'font-weight': 'bold',
    textContent: 'Symbol legend'
  })
  svg.appendChild(legendTitle)
  const configToUse = dataSource.value === 'upload' && Object.keys(dynamicTypeConfig.value).length > 0 
    ? dynamicTypeConfig.value 
    : TYPE_CONFIG
  Object.values(configToUse).forEach((typeConfig, index) => {
    const itemY = legendY + index * legendItemHeight
    const typeKey = Object.keys(configToUse)[index]
    const shape = createShape(legendX + legendItemWidth / 2, itemY + legendItemHeight / 2, 6, typeConfig.symbol, typeConfig.color, typeKey)
    svg.appendChild(shape)
    const label = createSVGElement('text', {
      x: legendX + legendItemWidth + 10,
      y: itemY + legendItemHeight / 2,
      'text-anchor': 'start',
      'dominant-baseline': 'middle',
      fill: '#000000',
      'font-size': 12,
      textContent: typeConfig.label
    })
    svg.appendChild(label)
  })
  drawCategoryLegend(svg, width, height, legendY + Object.values(configToUse).length * legendItemHeight + 20)
}
function drawCategoryLegend(svg, width, height, startY) {
  const legendX = width - config.rightMargin + 20
  const itemHeight = config.categoryLegendItemHeight
  const colorBoxSize = 10
  const title = createSVGElement('text', {
    x: legendX,
    y: startY,
    'text-anchor': 'start',
    'dominant-baseline': 'middle',
    fill: '#000000',
    'font-size': 15,
    'font-weight': 'bold',
    textContent: config.categoryLegendTitle
  })
  svg.appendChild(title)
  if (dataSource.value === 'upload') {
    Object.entries(dynamicGroupConfig.value).forEach(([groupName, config], index) => {
      const itemY = startY + (index + 1) * itemHeight
      const colorBox = createSVGElement('rect', {
        x: legendX,
        y: itemY - colorBoxSize / 2,
        width: colorBoxSize,
        height: colorBoxSize,
        fill: config.color,
        opacity: 0.7,
        stroke: config.separatorColor,
        'stroke-width': 1,
        'data-group-type': groupName
      })
      svg.appendChild(colorBox)
      const label = createSVGElement('text', {
        x: legendX + colorBoxSize + 10,
        y: itemY,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
        fill: '#000000',
        'font-size': 12,
        textContent: config.label
      })
      svg.appendChild(label)
    })
  } else {
    if (groupByColumn.value === 'Group') {
      Y_AXIS_GROUP_DATA.forEach((group, index) => {
        const itemY = startY + (index + 1) * itemHeight
        const colorBox = createSVGElement('rect', {
          x: legendX,
          y: itemY - colorBoxSize / 2,
          width: colorBoxSize,
          height: colorBoxSize,
          fill: group.color,
          opacity: 0.7,
          stroke: config.separatorColor,
          'stroke-width': 1,
          'data-group-type': group.value
        })
        svg.appendChild(colorBox)
        const label = createSVGElement('text', {
          x: legendX + colorBoxSize + 10,
          y: itemY,
          'text-anchor': 'start',
          'dominant-baseline': 'middle',
          fill: '#000000',
          'font-size': config.axisTextFontSize,
          textContent: group.value
        })
        svg.appendChild(label)
      })
    } else {
      const groupedViruses = {}
      const allViruses = Y_AXIS_GROUP_DATA.flatMap(group => group.children)
      allViruses.forEach((virusName, virusIndex) => {
        const categoryIndex = X_AXIS_CATEGORIES.indexOf(groupByColumn.value)
        let groupName = 'Unclassified'
        if (categoryIndex !== -1 && VIRUS_MATRIX_DATA[virusIndex] && VIRUS_MATRIX_DATA[virusIndex][categoryIndex]) {
          groupName = VIRUS_MATRIX_DATA[virusIndex][categoryIndex]
        }
        if (!groupedViruses[groupName]) {
          groupedViruses[groupName] = []
        }
        groupedViruses[groupName].push(virusName)
      })
      const groups = Object.entries(groupedViruses).map(([groupName, viruses], index) => ({
        value: groupName,
        label: groupName,
        children: viruses,
        color: GROUP_COLOR_LIST[index % GROUP_COLOR_LIST.length]
      }))
      groups.forEach((group, index) => {
        const itemY = startY + (index + 1) * itemHeight
        const colorBox = createSVGElement('rect', {
          x: legendX,
          y: itemY - colorBoxSize / 2,
          width: colorBoxSize,
          height: colorBoxSize,
          fill: group.color,
          opacity: 0.7,
          stroke: config.separatorColor,
          'stroke-width': 1,
          'data-group-type': group.value
        })
        svg.appendChild(colorBox)
        const label = createSVGElement('text', {
          x: legendX + colorBoxSize + 10,
          y: itemY,
          'text-anchor': 'start',
          'dominant-baseline': 'middle',
          fill: '#000000',
          'font-size': config.axisTextFontSize,
          textContent: group.value
        })
        svg.appendChild(label)
      })
    }
  }
}
function createShape(x, y, size, symbol, color, typeKey) {
  let shape
  const borderColor = borderColorSettings.value.pointBorderColor
  const borderWidth = borderSizeSettings.value.pointBorderWidth
  switch (symbol) {
    case 'star':
      shape = createStar(x, y, size, color, typeKey, borderColor, borderWidth)
      break
    case 'square':
      shape = createSquare(x, y, size, color, typeKey, borderColor, borderWidth)
      break
    case 'triangle':
      shape = createTriangle(x, y, size, color, typeKey, borderColor, borderWidth)
      break
    case 'triangle-down':
      shape = createTriangleDown(x, y, size, color, typeKey, borderColor, borderWidth)
      break
    case 'diamond':
      shape = createDiamond(x, y, size, color, typeKey, borderColor, borderWidth)
      break
    case 'circle':
      shape = createCircle(x, y, size, color, typeKey, borderColor, borderWidth)
      break
    default:
      shape = createCircle(x, y, size, color, typeKey, borderColor, borderWidth)
  }
  return shape
}
function createStar(x, y, size, color, typeKey, borderColor, borderWidth) {
  const outerRadius = size
  const innerRadius = size * 0.4
  const points = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI / 5) - Math.PI / 2
    const px = x + radius * Math.cos(angle)
    const py = y + radius * Math.sin(angle)
    points.push(`${px},${py}`)
  }
  const star = createSVGElement('polygon', {
    points: points.join(' '),
    fill: color,
    stroke: borderColor,
    'stroke-width': borderWidth,
    'data-type': typeKey,
    'data-border-type': 'pointBorder'
  })
  return star
}
function createSquare(x, y, size, color, typeKey, borderColor, borderWidth) {
  const halfSize = size * 0.8
  const square = createSVGElement('rect', {
    x: x - halfSize,
    y: y - halfSize,
    width: halfSize * 2,
    height: halfSize * 2,
    fill: color,
    stroke: borderColor,
    'stroke-width': borderWidth,
    'data-type': typeKey,
    'data-border-type': 'pointBorder'
  })
  return square
}
function createCircle(x, y, size, color, typeKey, borderColor, borderWidth) {
  const circle = createSVGElement('circle', {
    cx: x,
    cy: y,
    r: size * 0.8,
    fill: color,
    stroke: borderColor,
    'stroke-width': borderWidth,
    'data-type': typeKey,
    'data-border-type': 'pointBorder'
  })
  return circle
}
function createTriangle(x, y, size, color, typeKey, borderColor, borderWidth) {
  const points = []
  const height = size * 1.2
  const width = size * 1.2
  points.push(`${x},${y - height/2}`)
  points.push(`${x - width/2},${y + height/2}`)
  points.push(`${x + width/2},${y + height/2}`)
  const triangle = createSVGElement('polygon', {
    points: points.join(' '),
    fill: color,
    stroke: borderColor,
    'stroke-width': borderWidth,
    'data-type': typeKey,
    'data-border-type': 'pointBorder'
  })
  return triangle
}
function createTriangleDown(x, y, size, color, typeKey, borderColor, borderWidth) {
  const points = []
  const height = size * 1.2
  const width = size * 1.2
  points.push(`${x},${y + height/2}`)
  points.push(`${x - width/2},${y - height/2}`)
  points.push(`${x + width/2},${y - height/2}`)
  const triangle = createSVGElement('polygon', {
    points: points.join(' '),
    fill: color,
    stroke: borderColor,
    'stroke-width': borderWidth,
    'data-type': typeKey,
    'data-border-type': 'pointBorder'
  })
  return triangle
}
function createDiamond(x, y, size, color, typeKey, borderColor, borderWidth) {
  const points = []
  const height = size * 1.2
  const width = size * 1.2
  points.push(`${x},${y - height/2}`)
  points.push(`${x + width/2},${y}`)
  points.push(`${x},${y + height/2}`)
  points.push(`${x - width/2},${y}`)
  const diamond = createSVGElement('polygon', {
    points: points.join(' '),
    fill: color,
    stroke: borderColor,
    'stroke-width': borderWidth,
    'data-type': typeKey,
    'data-border-type': 'pointBorder'
  })
  return diamond
}
function drawBorder(svg, allViruses, xAxisCategoriesLength, numRows, config) {
  const startX = config.leftMargin
  const startY = config.topMargin
  const contentWidth = chartSizeSettings.value.groupLabelWidth + xAxisCategoriesLength * config.cellWidth
  const endX = startX + contentWidth
  const endY = startY + numRows * config.cellHeight
  if (config.borderLineStyle === 'double') {
    const border1 = createSVGElement('rect', {
      x: startX - 2,
      y: startY - 2,
      width: contentWidth + 4,
      height: endY - startY + 4,
      fill: 'none',
      stroke: borderColorSettings.value.chartBorderColor,
      'stroke-width': borderSizeSettings.value.chartBorderWidth,
      'data-border-type': 'chartBorder'
    })
    svg.appendChild(border1)
    const border2 = createSVGElement('rect', {
      x: startX + 2,
      y: startY + 2,
      width: contentWidth - 4,
      height: endY - startY - 4,
      fill: 'none',
      stroke: borderColorSettings.value.chartBorderColor,
      'stroke-width': borderSizeSettings.value.chartBorderWidth,
      'data-border-type': 'chartBorder'
    })
    svg.appendChild(border2)
  } else {
    const border = createSVGElement('rect', {
      x: startX,
      y: startY,
      width: contentWidth,
      height: endY - startY,
      fill: 'none',
      stroke: borderColorSettings.value.chartBorderColor,
      'stroke-width': borderSizeSettings.value.chartBorderWidth,
      'stroke-dasharray': getStrokeDashArray(config.borderLineStyle),
      'data-border-type': 'chartBorder'
    })
    svg.appendChild(border)
  }
}
</script>
<template>
  <div class="page-container">
    <div v-if="showModal" class="custom-modal-overlay" @click.self="closeModal">
      <div class="custom-modal">
        <p class="modal-message">{{ modalMessage }}</p>
        <button class="modal-confirm-btn" @click="closeModal">确认</button>
      </div>
    </div>
    <div class="main-container">
      <div class="left-panel" :style="{ width: leftPanelWidth + 'px' }">
        <div class="panel-header">
          数据管理
        </div>
        <div class="panel-content">
          <div class="collapsible-module">
            <div class="collapsible-header" @click="toggleModule('upload')">
              <span class="module-title">数据上传</span>
              <span class="collapse-icon" :class="{ collapsed: collapsedModules.upload }">▼</span>
            </div>
            <div class="collapsible-content" v-show="!collapsedModules.upload">
              <div class="control-group">
                <label>选择数据源</label>
                <select id="dataSource" v-model="dataSource">
                  <option value="demo">示例数据</option>
                  <option value="upload">上传文件</option>
                </select>
              </div>
              <div class="control-group">
                <div class="file-upload-wrapper" :class="{ disabled: dataSource === 'demo' }">
                  <div class="file-upload">
                    <input type="file" id="fileUpload" accept=".csv,.xlsx,.json" @change="handleFileSelect">
                    <label for="fileUpload" class="file-upload-label">上传文件</label>
                  </div>
                  <div class="file-input">
                    <input type="text" :value="selectedFile || 'No file selected'" :class="{ placeholder: !selectedFile }" readonly>
                  </div>
                </div>
              </div>            
              <div class="button-group">
                <button class="btn btn-primary" @click="generateChart">生成图表</button>
              </div>
            </div>
          </div>
          <div class="collapsible-module">
            <div class="collapsible-header" @click="toggleModule('color')">
              <span class="module-title">颜色设置</span>
              <span class="collapse-icon" :class="{ collapsed: collapsedModules.color }">▼</span>
            </div>
            <div class="collapsible-content" v-show="!collapsedModules.color">
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('colorInner')">
                  <span class="nested-module-title">符号颜色</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.colorInner }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.colorInner">
                  <template v-if="dataSource === 'demo'">
                    <div class="control-group">
                      <label>Known符号颜色</label>
                      <div class="color-picker-item">
                        <input type="color" v-model="colorSettings.knownColor" @input="updateChartColors">
                        <span>当前颜色</span>
                      </div>
                    </div>
                    <div class="control-group">
                      <label>Novel(Annotated)符号颜色</label>
                      <div class="color-picker-item">
                        <input type="color" v-model="colorSettings.annotatedColor" @input="updateChartColors">
                        <span>当前颜色</span>
                      </div>
                    </div>
                    <div class="control-group">
                      <label>Novel(Not annotated)符号颜色</label>
                      <div class="color-picker-item">
                        <input type="color" v-model="colorSettings.notAnnotatedColor" @input="updateChartColors">
                        <span>当前颜色</span>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="dataSource === 'upload'">
                    <div v-if="Object.keys(dynamicTypeConfig).length > 0">
                      <div v-for="(config, typeKey) in dynamicTypeConfig" :key="typeKey" class="control-group">
                        <label>{{ config.label }} 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" :value="config.color" @input="updateDynamicColor(typeKey, $event)">
                          <span>当前颜色</span>
                        </div>
                      </div>
                    </div>
                    <div v-else>
                      <div class="control-group">
                        <span>请先上传数据文件</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('textColor')">
                  <span class="nested-module-title">文字颜色</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.textColor }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.textColor">
                  <div class="control-group">
                    <label>标题文字颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="textColorSettings.titleColor" @input="updateTextColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>X轴标题文字颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="textColorSettings.xAxisTitleColor" @input="updateTextColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>Y轴标题文字颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="textColorSettings.yAxisTitleColor" @input="updateTextColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>X轴横坐标文字颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="textColorSettings.xAxisTextColor" @input="updateTextColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>第一列文字颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="textColorSettings.firstColumnTextColor" @input="updateTextColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('groupColor')">
                  <span class="nested-module-title">分类列颜色</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.groupColor }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.groupColor">
                  <template v-if="dataSource === 'demo'">
                    <div v-if="groupByColumn === 'Group'">
                      <div class="control-group">
                        <label>Group1 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group1" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                      <div class="control-group">
                        <label>Group2 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group2" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                      <div class="control-group">
                        <label>Group3 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group3" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                      <div class="control-group">
                        <label>Group4 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group4" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                      <div class="control-group">
                        <label>Group5 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group5" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                      <div class="control-group">
                        <label>Group6 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group6" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                      <div class="control-group">
                        <label>Group7 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" v-model="groupColorSettings.Group7" @input="updateGroupColors">
                          <span>当前颜色</span>
                        </div>
                      </div>
                    </div>                   
                     <div v-else>
                      <div v-for="(group, index) in getCurrentGroups()" :key="group.value" class="control-group">
                        <label>{{ group.value }} 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" :value="group.color" @input="updateDynamicGroupColor(group.value, $event)">
                          <span>当前颜色</span>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="dataSource === 'upload'">
                    <div v-if="Object.keys(dynamicGroupConfig).length > 0">
                      <div v-for="(config, groupName) in dynamicGroupConfig" :key="groupName" class="control-group">
                        <label>{{ config.label }} 颜色</label>
                        <div class="color-picker-item">
                          <input type="color" :value="config.color" @input="updateDynamicGroupColor(groupName, $event)">
                          <span>当前颜色</span>
                        </div>
                      </div>
                    </div>
                    <div v-else>
                      <div class="control-group">
                        <span>请先上传数据文件</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('borderColor')">
                  <span class="nested-module-title">边框颜色</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.borderColor }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.borderColor">
                  <div class="control-group">
                    <label>符号边框颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="borderColorSettings.pointBorderColor" @input="updateBorderColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>行分隔线颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="borderColorSettings.rowSeparatorColor" @input="updateBorderColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>列分隔线颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="borderColorSettings.columnSeparatorColor" @input="updateBorderColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                  <div class="control-group">
                    <label>图表边框颜色</label>
                    <div class="color-picker-item">
                      <input type="color" v-model="borderColorSettings.chartBorderColor" @input="updateBorderColors">
                      <span>当前颜色</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="collapsible-module">
            <div class="collapsible-header" @click="toggleModule('size')">
              <span class="module-title">大小设置</span>
              <span class="collapse-icon" :class="{ collapsed: collapsedModules.size }">▼</span>
            </div>
            <div class="collapsible-content" v-show="!collapsedModules.size">
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('symbolSize')">
                  <span class="nested-module-title">符号大小</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.symbolSize }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.symbolSize">
                  <template v-if="dataSource === 'demo'">
                    <div class="control-group">
                      <label>Known符号大小</label>
                      <input type="number" v-model="symbolSizeSettings.knownSize" min="1" max="20" step="1" @input="updateSymbolSizes">
                    </div>
                    <div class="control-group">
                      <label>Novel(Annotated)符号大小</label>
                      <input type="number" v-model="symbolSizeSettings.annotatedSize" min="1" max="20" step="1" @input="updateSymbolSizes">
                    </div>
                    <div class="control-group">
                      <label>Novel(Not annotated)符号大小</label>
                      <input type="number" v-model="symbolSizeSettings.notAnnotatedSize" min="1" max="20" step="1" @input="updateSymbolSizes">
                    </div>
                  </template>
                  <template v-else-if="dataSource === 'upload'">
                    <div v-if="Object.keys(dynamicTypeConfig).length > 0">
                      <div v-for="(config, typeKey) in dynamicTypeConfig" :key="typeKey" class="control-group">
                        <label>{{ config.label }} 符号大小</label>
                        <input type="number" :value="config.size || 8" min="1" max="20" step="1" @input="updateDynamicSymbolSize(typeKey, $event)">
                      </div>
                    </div>
                    <div v-else>
                      <div class="control-group">
                        <span>请先上传数据文件</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('fontSize')">
                  <span class="nested-module-title">字体大小</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.fontSize }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.fontSize">
                  <div class="control-group">
                    <label>标题字体大小</label>
                    <input type="number" v-model="fontSizeSettings.titleFontSize" min="1" max="48" step="1" @input="updateFontSizes">
                  </div>
                  <div class="control-group">
                    <label>X轴标题字体大小</label>
                    <input type="number" v-model="fontSizeSettings.xAxisTitleFontSize" min="1" max="30" step="1" @input="updateFontSizes">
                  </div>
                  <div class="control-group">
                    <label>Y轴标题字体大小</label>
                    <input type="number" v-model="fontSizeSettings.yAxisTitleFontSize" min="1" max="30" step="1" @input="updateFontSizes">
                  </div>
                  <div class="control-group">
                    <label>X轴坐标字体大小</label>
                    <input type="number" v-model="fontSizeSettings.axisTextFontSize" min="1" max="24" step="1" @input="updateFontSizes">
                  </div>
                  <div class="control-group">
                    <label>图第一列文字大小</label>
                    <input type="number" v-model="fontSizeSettings.firstColumnFontSize" min="1" max="24" step="1" @input="updateFontSizes">
                  </div>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('chartSize')">
                  <span class="nested-module-title">图表大小</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.chartSize }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.chartSize">
                  <div class="control-group">
                    <label>图表宽度 (px)</label>
                    <input type="number" v-model="chartSizeSettings.chartWidth" min="200" max="3000" step="10" @input="handleChartWidthChange">
                  </div>
                  <div class="control-group">
                    <label>图表高度 (px)</label>
                    <input type="number" v-model="chartSizeSettings.chartHeight" min="300" max="2000" step="10" @input="handleChartHeightChange">
                  </div>
                  <div class="control-group">
                    <label>图表名称列宽度 (px)</label>
                    <input type="number" v-model="chartSizeSettings.groupLabelWidth" min="100" max="500" step="10" @input="renderChart">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="collapsible-module">
            <div class="collapsible-header" @click="toggleModule('font')">
              <span class="module-title">字体设置</span>
              <span class="collapse-icon" :class="{ collapsed: collapsedModules.font }">▼</span>
            </div>
            <div class="collapsible-content" v-show="!collapsedModules.font">
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('titleSettings')">
                  <span class="nested-module-title">标题字体</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.titleSettings }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.titleSettings">
                  <div class="control-group">
                    <label>标题字体样式</label>
                    <select v-model="titleSettings.fontFamily" @change="updateTitleSettings">
                      <option value="Arial">Arial</option>
                      <option value="SimSun">SimSun</option>
                      <option value="KaiTi">KaiTi</option>
                      <option value="SimHei">SimHei</option> 
                       <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>标题内容</label>
                    <input type="text" v-model="titleText" @input="updateTitleContent">
                  </div>
                  <div class="control-group">
                    <label>标题水平对齐方式</label>
                    <select v-model="titleSettings.textAlign" @change="updateTitleSettings">
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('xAxisTitleSettings')">
                  <span class="nested-module-title">行标题字体</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.xAxisTitleSettings }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.xAxisTitleSettings">
                  <div class="control-group">
                    <label>X轴标题字体样式</label>
                    <select v-model="xAxisTitleSettings.fontFamily" @change="updateXAxisTitleSettings">
                      <option value="Arial">Arial</option>
                      <option value="SimSun">SimSun</option>
                      <option value="KaiTi">KaiTi</option>
                      <option value="SimHei">SimHei</option> 
                       <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>X轴标题内容</label>
                    <input type="text" v-model="xAxisTitleContent" @input="updateXAxisTitleContent">
                  </div>
                  <div class="control-group">
                    <label>X轴标题水平对齐方式</label>
                    <select v-model="xAxisTitleSettings.textAlign" @change="updateXAxisTitleSettings">
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>X轴坐标字体样式</label>
                    <select v-model="xAxisTextSettings.fontFamily" @change="updateXAxisTextSettings">
                      <option value="Arial">Arial</option>
                      <option value="SimSun">SimSun</option>
                      <option value="KaiTi">KaiTi</option>
                      <option value="SimHei">SimHei</option> 
                       <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('yAxisTitleSettings')">
                  <span class="nested-module-title">列标题字体</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.yAxisTitleSettings }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.yAxisTitleSettings">
                  <div class="control-group">
                    <label>Y轴标题字体样式</label>
                    <select v-model="yAxisTitleSettings.fontFamily" @change="updateYAxisTitleSettings">
                      <option value="Arial">Arial</option>
                      <option value="SimSun">SimSun</option>
                      <option value="KaiTi">KaiTi</option>
                      <option value="SimHei">SimHei</option> 
                       <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>Y轴标题内容</label>
                    <input type="text" v-model="yAxisTitleContent" @input="updateYAxisTitleContent">
                  </div>
                  <div class="control-group">
                    <label>Y轴标题垂直对齐方式</label>
                    <select v-model="yAxisTitleSettings.textAlign" @change="updateYAxisTitleSettings">
                      <option value="top">顶部对齐</option>
                      <option value="middle">居中</option>
                      <option value="bottom">底部对齐</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>第一列文字字体样式</label>
                    <select v-model="yAxisTextSettings.fontFamily" @change="updateYAxisTextSettings">
                      <option value="Arial">Arial</option>
                      <option value="SimSun">SimSun</option>
                      <option value="KaiTi">KaiTi</option>
                      <option value="SimHei">SimHei</option> 
                       <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="collapsible-module">
            <div class="collapsible-header" @click="toggleModule('extra')">
              <span class="module-title">附加设置</span>
              <span class="collapse-icon" :class="{ collapsed: collapsedModules.extra }">▼</span>
            </div>
            <div class="collapsible-content" v-show="!collapsedModules.extra">
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('lineStyleSettings')">
                  <span class="nested-module-title">线样式</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.lineStyleSettings }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.lineStyleSettings">
                  <div class="control-group">
                    <label>行分隔线样式</label>
                    <select v-model="lineStyleSettings.rowSeparatorStyle" @change="updateLineStyles">
                      <option value="solid">实线</option>
                      <option value="dashed">虚线</option>
                      <option value="dotted">点线</option>
                      <option value="double">双实线</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>列分隔线样式</label>
                    <select v-model="lineStyleSettings.columnSeparatorStyle" @change="updateLineStyles">
                      <option value="solid">实线</option>
                      <option value="dashed">虚线</option>
                      <option value="dotted">点线</option>
                      <option value="double">双实线</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>边框线样式</label>
                    <select v-model="lineStyleSettings.borderLineStyle" @change="updateLineStyles">
                      <option value="solid">实线</option>
                      <option value="dashed">虚线</option>
                      <option value="dotted">点线</option>
                      <option value="double">双实线</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('symbolStyleSettings')">
                  <span class="nested-module-title">符号样式</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.symbolStyleSettings }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.symbolStyleSettings">
                  <template v-if="dataSource === 'demo'">
                    <div class="control-group">
                      <label>Known符号</label>
                      <select v-model="symbolStyleSettings.knownSymbol" @change="updateSymbolStyles">
                        <option v-for="type in SYMBOL_TYPES" :key="type" :value="type">{{ SYMBOL_NAMES[type] }}</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label>Novel(Annotated)符号</label>
                      <select v-model="symbolStyleSettings.annotatedSymbol" @change="updateSymbolStyles">
                        <option v-for="type in SYMBOL_TYPES" :key="type" :value="type">{{ SYMBOL_NAMES[type] }}</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label>Novel(Not annotated)符号</label>
                      <select v-model="symbolStyleSettings.notAnnotatedSymbol" @change="updateSymbolStyles">
                        <option v-for="type in SYMBOL_TYPES" :key="type" :value="type">{{ SYMBOL_NAMES[type] }}</option>
                      </select>
                    </div>
                  </template>
                  <template v-else-if="dataSource === 'upload'">
                    <div v-if="Object.keys(dynamicTypeConfig).length > 0">
                      <div v-for="(config, typeKey) in dynamicTypeConfig" :key="typeKey" class="control-group">
                        <label>{{ config.label }} 符号</label>
                        <select :value="config.symbol" @change="updateDynamicSymbol(typeKey, $event)">
                          <option v-for="type in SYMBOL_TYPES" :key="type" :value="type">{{ SYMBOL_NAMES[type] }}</option>
                        </select>
                      </div>
                    </div>
                    <div v-else>
                      <div class="control-group">
                        <span>请先上传数据文件</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>              <div class="nested-collapsible-module">
                <div class="nested-collapsible-header" @click="toggleModule('borderSize')">
                  <span class="nested-module-title">边框样式</span>
                  <span class="collapse-icon" :class="{ collapsed: collapsedModules.borderSize }">▼</span>
                </div>
                <div class="nested-collapsible-content" v-show="!collapsedModules.borderSize">
                  <div class="control-group">
                    <label>符号边框粗细 (px)</label>
                    <input type="number" v-model="borderSizeSettings.pointBorderWidth" min="0" max="5" step="0.1" @input="updateBorderSizes">
                  </div>
                  <div class="control-group">
                    <label>行分隔线粗细 (px)</label>
                    <input type="number" v-model="borderSizeSettings.rowSeparatorWidth" min="0" max="5" step="0.1" @input="updateBorderSizes">
                  </div>
                  <div class="control-group">
                    <label>列分隔线粗细 (px)</label>
                    <input type="number" v-model="borderSizeSettings.columnSeparatorWidth" min="0" max="5" step="0.1" @input="updateBorderSizes">
                  </div>
                  <div class="control-group">
                    <label>图表边框粗细 (px)</label>
                    <input type="number" v-model="borderSizeSettings.chartBorderWidth" min="0" max="5" step="0.1" @input="updateBorderSizes">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div 
        class="resizer" 
        @mousedown="startResize"
        @mouseenter="showResizeCursor"
        @mouseleave="hideResizeCursor"
      ></div>
      <div class="right-panel">
        <div class="tabs">
          <div 
            class="tab" 
            :class="{ active: activeTab === 'preview' }"
            @click="switchTab('preview')"
          >
            数据预览
          </div>
          <div 
            class="tab" 
            :class="{ active: activeTab === 'matrix' }"
            @click="switchTab('matrix')"
          >
            图表预览
          </div>
        </div>
        <div class="tab-content">
          <div v-show="activeTab === 'preview' && chartGenerated" class="data-preview-container">
            <template v-if="chartGenerated">
              <div class="data-preview-header">
                <h3>数据预览</h3>
                <div class="data-stats">
                  <span class="stat-item">数量: <strong>{{ getVirusCount() }}</strong></span>
                  <span class="stat-item">片段: <strong>{{ getSegmentCount() }}</strong></span>
                  <span class="stat-item">数据点: <strong>{{ getDataPointCount() }}</strong></span>
                  <button v-if="dataSource === 'demo'" class="btn btn-primary btn-small" @click="downloadSampleData">
                    下载示例数据
                  </button>
                </div>
              </div>
              <div class="data-preview-controls">
                <div class="items-per-page">
                  <label>每页显示：</label>
                  <select v-model="itemsPerPage" @change="onItemsPerPageChange">
                    <option value="10">10条</option>
                    <option value="25">25条</option>
                    <option value="50">50条</option>
                    <option value="100">100条</option>
                  </select>
                </div>
                <div class="search-box">
                  <input 
                    type="text" 
                    v-model="searchQuery" 
                    @input="onSearchChange"
                    placeholder="搜索名称..."
                  />
                </div>
              </div>
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <template v-if="dataSource === 'demo' || (dataSource === 'upload' && uploadedXAxis.length === 0)">
                        <th v-for="(category, index) in ['Virus Name','Class', ...X_AXIS_CATEGORIES]" :key="index">{{ category }}</th>
                      </template>
                      <template v-else-if="dataSource === 'upload' && uploadedXAxis.length > 0">
                        <th v-for="(category, index) in uploadedXAxis" :key="index">{{ category }}</th>
                      </template>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="dataSource === 'demo' || (dataSource === 'upload' && uploadedYAxis.length === 0)">
                      <tr v-for="item in getCurrentPageData()" :key="item.name">
                        <td>{{ item.name }}</td>
                        <td>{{ getVirusGroup(item.name) || '-' }}</td>
                        <template v-for="(category, colIndex) in X_AXIS_CATEGORIES" :key="colIndex">
                          <td>{{ getVirusData(item.name, category) || '-' }}</td>
                        </template>
                      </tr>
                    </template>
                    <template v-else-if="dataSource === 'upload' && uploadedYAxis.length > 0">
                      <tr v-for="virus in getCurrentPageData()" :key="virus.name">
                        <template v-for="category in uploadedXAxis" :key="category">
                          <td>{{ category === 'Virus Name' || category === '病毒名称' ? virus.name : (virus.data[category] || '-') }}</td>
                        </template>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <div class="pagination">
                <div class="pagination-info">
                  当前展示第 {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, getFilteredData().length) }} 条，共 {{ getFilteredData().length }} 条，共分 {{ getTotalPages() }} 页
                </div>
                <div class="pagination-controls">
                  <button class="pagination-btn" @click="goToPreviousPage" :disabled="currentPage === 1">
                    上一页
                  </button>
                  <div class="page-numbers">
                    <button 
                      v-for="page in Math.min(getTotalPages(), 5)" 
                      :key="page"
                      class="pagination-btn page-number"
                      :class="{ active: page === currentPage }"
                      @click="goToPage(page)"
                    >
                      {{ page }}
                    </button>
                    <span v-if="getTotalPages() > 5" class="pagination-ellipsis">...</span>
                  </div>
                  <button class="pagination-btn" @click="goToNextPage" :disabled="currentPage === getTotalPages()">
                    下一页
                  </button>
                </div>
              </div>
            </template>
          </div>
          <div v-show="activeTab === 'matrix' && chartGenerated" class="canvas-container" :class="{ 'has-content': chartGenerated }">
            <div class="download-buttons">
              <button class="btn-download" @click="exportChartAsSVG">
                <span>SVG下载</span>
              </button>
              <button class="btn-download" @click="exportChartAsPDF">
                <span>PDF下载</span>
              </button>
            </div>
            <div ref="svgContainer" class="svg-wrapper"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.help-text {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease;
}
.help-text:hover {
  color: #3088E0;
}
.help-text-container {
  margin-top: 20px;
  text-align: center;
}
.help-container {
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  max-width: 100%;
  box-sizing: border-box;
}
.help-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.help-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
}
.help-modal-header h2 {
  margin: 0;
  color: #333;
}
.close-button {
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s ease;
}
.close-button:hover {
  color: #333;
}
.help-modal-body {
  padding: 20px;
}
.help-modal-body h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}
.help-modal-body p {
  margin-bottom: 10px;
  color: #666;
  line-height: 1.5;
}
.help-modal-body ul {
  margin-bottom: 20px;
  padding-left: 20px;
}
.help-modal-body li {
  margin-bottom: 5px;
  color: #666;
  line-height: 1.5;
}
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.custom-modal {
  background: white;
  border-radius: 8px;
  padding: 2vw 3vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 200px;
  max-width: 90vw;
  width: 28vw;
}
.modal-message {
  font-size: calc(15px + 0.7vw);
  color: #333;
  margin: 0 0 1.5vw 0;
  font-weight: 500;
  line-height: 1.5;
}
.modal-confirm-btn {
  font-size: calc(12px + 0.7vw);
  padding: 0.8vw 2.5vw;
  background: #4088E0;
  color: white;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.3s;
  min-height: 40px;
  min-width: 80px;
}
.modal-confirm-btn:hover {
  background: #2c6bb8;
}
.page-container {
  width: 100%;
  height: 100vh;
  background: #DEF0F9;
  overflow: hidden;
}
.main-container {
  display: flex;
  width: 100%;
  margin: 0;
  padding: 0;
  height: 100vh;
  box-sizing: border-box;
}
.left-panel {
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}
.resizer {
  width: 2px;
  background: #f1f1f1;
  cursor: col-resize;
  transition: background 0.2s;
  flex-shrink: 0;
  z-index: 100;
  position: relative;
}
.resizer:hover {
  background: #c1c1c1;
}
.resizer.resizing {
  background: #c1c1c1;
}
.panel-header {
  padding: 15px 20px;
  background: #4167B1;
  color: white;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #1B1F23;
}
.panel-header::before {
  content: '';
  width: 4px;
  height: 20px;
  background: #DEF0F9;
  border-radius: 2px;
}
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.panel-content::-webkit-scrollbar {
  width: 6px;
}
.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
.module {
  margin-bottom: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}
.module-content {
  padding: 15px;
}
.collapsible-module {
  margin-bottom: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
.collapsible-header {
  padding: 12px 15px;
  background: #4167B1;
  color: white;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.3s;
  user-select: none;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.collapsible-header:hover {
  background: #33508c;;
}
.collapsible-header .module-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: white;
}
.collapsible-header .module-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: #DEF0F9;
  border-radius: 2px;
}
.collapse-icon {
  font-size: 12px;
  transition: transform 0.3s;
}
.collapse-icon.collapsed {
  transform: rotate(-90deg);
}
.collapsible-content {
  padding: 15px;
  transition: all 0.3s ease;
}
.nested-collapsible-module {
  margin-top: 15px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
.nested-collapsible-header {
  padding: 10px 12px;
  background: #6383c3;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.3s;
  user-select: none;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.nested-collapsible-header:hover {
  background:  #4e72bc;
}
.nested-module-title {
  font-size: 14px;
  font-weight: 500;
}
.nested-collapsible-content {
  padding: 12px;
  background: white;
  transition: all 0.3s ease;
}
.color-picker-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.color-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
.color-picker-item input[type="color"] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}
.color-picker-item label {
  font-size: 14px;
  color: #555;
  flex: 1;
  margin: 0;
}
input[type="range"] {
  width: 100%;
  height: 6px;
  background: rgba(226, 232, 240, 0.8);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: rgba(104, 185, 234, 0.8);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: rgba(104, 185, 234, 1);
}
input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: rgba(104, 185, 234, 0.8);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.2);
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  transition: background 0.2s;
}
.checkbox-item:hover {
  background: #f8f9fa;
}
.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4088E0;
}
.checkbox-item label {
  font-size: 14px;
  color: #555;
  margin: 0;
  cursor: pointer;
  flex: 1;
}
.control-group {
  margin-bottom: 15px;
  position: relative;
}
.control-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #555;
  font-weight: 500;
}
.control-group select,
.control-group input[type="text"],
.control-group input[type="number"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}
.control-group select:focus,
.control-group input:focus {
  outline: none;
  border-color: #667eea;
}
.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}
.button-group-inline {
  display: flex;
  gap: 10px;
}
.button-group-inline .btn {
  flex: 1;
}
.data-list {
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}
.data-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.data-item:last-child {
  border-bottom: none;
}
.data-item:hover {
  background: #f8f9fa;
}
.data-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.data-info {
  font-size: 12px;
  color: #999;
  margin: 0 10px;
}
.file-upload {
  position: relative;
  display: inline-block;
  width: auto;
  height: 100%;
}
.file-upload input[type="file"] {
  display: none;
}
.file-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: #f0f0f0;
  color: #000000;
  border-radius: 4px 0 0 4px;
  border: 1px solid #c0c0c0;
  border-right: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: normal;
  white-space: nowrap;
  height: 100%;
  box-sizing: border-box;
}
.file-upload-label:hover {
  background: #e5e5e5;
}
.file-upload-wrapper {
  display: flex;
  gap: 0px;
  align-items: stretch;
  width: 100%;
  line-height: 1.5;
}
.file-upload-wrapper.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.file-upload-wrapper .file-upload {
  flex: 0 0 auto;
  width: auto;
}
.file-upload-wrapper .file-input {
  flex: 1;
  height: 100%;
}
.file-upload-wrapper .file-input input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #c0c0c0;
  border-radius: 0 4px 4px 0;
  font-size: 16px;
  background: #f5f5f5;
  color: #808080;
  height: 100%;
  box-sizing: border-box; 
}
.file-upload-wrapper .file-input input.placeholder {
  color: #808080;
}
.file-upload-wrapper .file-input input:focus {
  outline: none;
  border-color: #c0c0c0;
  box-shadow: none; 
}
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  min-width: 0;
}
.tabs {
  display: flex;
  background: rgba(248, 249, 250, 0.8);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 0;
  backdrop-filter: blur(8px);
}
.tab {
  padding: 15px 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #4a5568;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  position: relative;
  background: transparent;
}
.tab:hover {
  color: #4299e1;
  background: rgba(104, 185, 234, 0.1);
}
.tab.active {
  color: #4299e1;
  border-bottom-color: #90cdf4;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}
.tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(104, 185, 234, 0.8);
}
.tab-content {
  flex: 1;
  padding: 0;
  overflow: auto;
  position: relative;
}
.canvas-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: white;
  border-radius: 8px;
  border: none;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0 20px 20px 20px;
}
.canvas-container::-webkit-scrollbar {
  display: none;
}
.download-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
  justify-content: flex-start;
  background: white;
  padding: 20px 0 0 0;
  z-index: 10;
  flex-shrink: 0;
}
.canvas-container {
  padding-top: 0px;
}
.svg-wrapper {
  min-width: fit-content;
  min-height: fit-content;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: visible;
}
.btn-download {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #cccccc;
  border-radius: 8px; 
  color: #000000; 
  cursor: pointer;
  font-size: 14px;
  font-weight: normal; 
  transition: background-color 0.2s; 
}
.btn-download:hover {
  background-color: #f5f5f5;
}
.btn-download-sample {
  display: flex;
  align-items: center;
  padding: 10px 10px;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}
.btn-download-sample:hover {
  background-color: #5a6fd6;
}
.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.btn {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
}
.btn-primary {
  background: #4167B1;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(65, 103, 177, 0.3);
  background:#385898;
}
.btn-small {
  flex: none;
  padding: 10px 16px;
  font-size: 14px;
  white-space: nowrap;
}
.btn-secondary {
  background: #DEF0F9;
  color: #1B1F23;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.btn-secondary:hover {
  background: #4167B1;
  color: white;
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.checkbox-item input[type="checkbox"] {
  width: 50px;
  height: 30px;
  cursor: pointer;
}
.checkbox-item label {
  font-size: 15px;
  color: #555;
  cursor: pointer;
}
.data-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.data-preview-header {
  padding: 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}
.data-preview-header h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #333;
}
.data-stats {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}
.stat-item {
  font-size: 16px;
  color: #666;
}
.stat-item strong {
  color: #667eea;
  font-size: 16px;
}
.data-table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  padding: 20px;
  margin-bottom: 20px;
  max-height: calc(100vh - 300px);
  flex: 1;
}
.data-table {
  width: auto;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.4;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
}
.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  font-weight: 500;
  font-size: 16px;
  white-space: normal;
  word-wrap: break-word;
  min-width: 10px;
  max-width: calc(100vw / 20);
}
.data-table thead {
  background: rgba(160, 210, 255, 1);
  color: #4a5568;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.data-preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  gap: 20px;
  backdrop-filter: blur(8px);
}
.items-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}
.items-per-page label {
  font-size: 16px;
  color: #4a5568;
  font-weight: 500;
}
.items-per-page select {
  padding: 8px 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 6px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: border-color 0.2s;
  color: #4a5568;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.items-per-page select:hover {
  border-color: rgba(104, 185, 234, 0.8);
}
.items-per-page select:focus {
  outline: none;
  border-color: rgba(104, 185, 234, 0.8);
  box-shadow: 0 0 0 3px rgba(104, 185, 234, 0.1);
}
.search-box {
  flex: 1;
  max-width: 300px;
}
.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.search-box input:hover {
  border-color: rgba(104, 185, 234, 0.8);
}
.search-box input:focus {
  outline: none;
  border-color: rgba(104, 185, 234, 0.8);
  box-shadow: 0 0 0 3px rgba(104, 185, 234, 0.1);
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  gap: 20px;
  backdrop-filter: blur(8px);
}
.pagination-info {
  font-size: 14px;
  color: #4a5568;
  white-space: nowrap;
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pagination-btn {
  padding: 8px 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.pagination-btn:hover:not(:disabled) {
  background: rgba(104, 185, 234, 0.8);
  color: #4a5568;
  border-color: rgba(104, 185, 234, 0.8);
  box-shadow: 0 2px 4px rgba(104, 185, 234, 0.2);
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-btn.page-number {
  min-width: 40px;
  padding: 8px 12px;
}
.pagination-btn.page-number.active {
  background: rgba(104, 185, 234, 0.8);
  color: #4a5568;
  border-color: rgba(104, 185, 234, 0.8);
  box-shadow: 0 2px 4px rgba(104, 185, 234, 0.2);
}
.page-numbers {
  display: flex;
  align-items: center;
  gap: 5px;
}
.pagination-ellipsis {
  padding: 8px 4px;
  color: #999;
  font-size: 14px;
}
.data-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}
.data-table tbody tr:hover {
  background-color: #f5f5f5;
}
.data-table td {
  padding: 12px 15px;
  font-size: 15px;
  color: #555;
  white-space: normal;
  word-wrap: break-word;
  min-width: 10px;
  max-width: 110px;
}
.data-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}
.data-table tbody tr:nth-child(even):hover {
  background-color: #f0f0f0;
}
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.help-container {
  padding: 20px;
  background: white;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
  max-width: 100%;
  box-sizing: border-box;
}
.help-content {
  max-width: 100%;
  margin: 0;
}
.help-content h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}
.help-content p {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #666;
}
.help-content ul {
  margin-bottom: 20px;
  padding-left: 20px;
}
.help-content li {
  margin-bottom: 5px;
  line-height: 1.5;
  color: #666;
}
.help-content strong {
  color: #333;
  font-weight: 600;
}
</style>
