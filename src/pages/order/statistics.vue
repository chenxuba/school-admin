<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  DollarOutlined,
  MoneyCollectOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { type GetOrderStatisticsParams, type OrderStatistics, getOrderStatistics } from '~/api/order'

// 响应式数据
const loading = ref(false)
const statistics = ref<OrderStatistics | null>(null)
const dateRange = ref<any>(null)
const statusChartRef = ref<HTMLDivElement>()
const trendChartRef = ref<HTMLDivElement>()
let statusChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 筛选表单
const filterForm = reactive<GetOrderStatisticsParams>({
  type: 'day',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
})

// 热销商品表格列配置
const hotGoodsColumns = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
  },
  {
    title: '商品名称',
    dataIndex: 'goodsName',
    key: 'goodsName',
  },
  {
    title: '销售数量',
    dataIndex: 'totalQuantity',
    key: 'totalQuantity',
    width: 120,
  },
  {
    title: '销售金额',
    key: 'totalAmount',
    width: 120,
  },
]

// 获取统计数据
async function fetchStatistics() {
  try {
    loading.value = true
    const response = await getOrderStatistics(filterForm)
    if (response.data) {
      statistics.value = response.data
      await nextTick()
      renderCharts()
    }
  }
  catch (error) {
    message.error('获取统计数据失败')
  }
  finally {
    loading.value = false
  }
}

// 搜索处理
function handleSearch() {
  fetchStatistics()
}

// 重置搜索
function handleReset() {
  filterForm.type = 'day'
  filterForm.startDate = dayjs().format('YYYY-MM-DD')
  filterForm.endDate = dayjs().format('YYYY-MM-DD')
  dateRange.value = [dayjs(), dayjs()]
  fetchStatistics()
}

// 日期范围变化处理
function handleDateChange(dates: any) {
  if (dates && dates.length === 2) {
    filterForm.startDate = dayjs(dates[0]).format('YYYY-MM-DD')
    filterForm.endDate = dayjs(dates[1]).format('YYYY-MM-DD')
  }
  else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
}

// 渲染图表
function renderCharts() {
  if (!statistics.value)
    return

  renderStatusChart()
  renderTrendChart()
}

// 渲染订单状态分布图
function renderStatusChart() {
  if (!statusChartRef.value || !statistics.value)
    return

  if (statusChart) {
    statusChart.dispose()
  }

  statusChart = echarts.init(statusChartRef.value)

  const statusData = [
    { name: '待确认', value: statistics.value.statusStats.pending },
    { name: '已确认', value: statistics.value.statusStats.confirmed },
    { name: '制作中', value: statistics.value.statusStats.preparing },
    { name: '配送中', value: statistics.value.statusStats.delivering },
    { name: '已完成', value: statistics.value.statusStats.completed },
    { name: '已取消', value: statistics.value.statusStats.cancelled },
  ].filter(item => item.value > 0)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: '50%',
        data: statusData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }

  statusChart.setOption(option)
}

// 渲染订单趋势图
function renderTrendChart() {
  if (!trendChartRef.value || !statistics.value)
    return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(trendChartRef.value)

  const trendData = statistics.value.trendData || []
  const xData = trendData.map(item => item.time)
  const yData = trendData.map(item => item.orders)

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '订单数量',
        type: 'line',
        data: yData,
        smooth: true,
        itemStyle: {
          color: '#1890ff',
        },
        areaStyle: {
          color: 'rgba(24, 144, 255, 0.1)',
        },
      },
    ],
  }

  trendChart.setOption(option)
}

// 获取排名颜色
function getRankColor(index: number) {
  const colors = ['gold', 'silver', '#cd7f32', 'blue', 'green']
  return colors[index] || 'default'
}

// 监听窗口大小变化
function handleResize() {
  statusChart?.resize()
  trendChart?.resize()
}

// 组件挂载时初始化
onMounted(() => {
  // 设置默认日期范围为今天
  dateRange.value = [dayjs(), dayjs()]
  fetchStatistics()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onUnmounted(() => {
  statusChart?.dispose()
  trendChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

// 监听统计数据变化
watch(() => statistics.value, () => {
  if (statistics.value) {
    nextTick(() => {
      renderCharts()
    })
  }
})
</script>

<template>
  <div class="order-statistics">
    <!-- 筛选条件 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="filterForm" @finish="handleSearch">
        <a-form-item label="统计类型">
          <a-select v-model="filterForm.type" style="width: 120px">
            <a-select-option value="day">
              按天
            </a-select-option>
            <a-select-option value="week">
              按周
            </a-select-option>
            <a-select-option value="month">
              按月
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="日期范围">
          <a-range-picker
            v-model="dateRange"
            format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">
            <SearchOutlined /> 查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 统计概览 -->
    <a-row :gutter="16" class="summary-cards">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="总订单数"
            :value="statistics?.summary.totalOrders || 0"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <ShoppingCartOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card>
          <a-statistic
            title="总营业额"
            :value="statistics?.summary.totalAmount || 0"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <MoneyCollectOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card>
          <a-statistic
            title="平均订单金额"
            :value="statistics?.summary.avgOrderAmount || 0"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <DollarOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card>
          <a-statistic
            title="完成订单数"
            :value="statistics?.summary.completedOrders || 0"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 订单状态分布 -->
    <a-row :gutter="16" class="charts-row">
      <a-col :span="12">
        <a-card title="订单状态分布" :bordered="false">
          <div ref="statusChartRef" style="height: 300px" />
        </a-card>
      </a-col>

      <a-col :span="12">
        <a-card title="订单趋势" :bordered="false">
          <div ref="trendChartRef" style="height: 300px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 热销商品 -->
    <a-card title="热销商品 TOP 10" :bordered="false" class="hot-goods-card">
      <a-table
        :columns="hotGoodsColumns"
        :data-source="statistics?.hotGoods || []"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'rank'">
            <a-tag :color="getRankColor(index)">
              {{ index + 1 }}
            </a-tag>
          </template>
          <template v-if="column.key === 'totalAmount'">
            ¥{{ record.totalAmount.toFixed(2) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped lang="less">
.order-statistics {
  .filter-card {
    margin-bottom: 16px;
  }

  .summary-cards {
    margin-bottom: 16px;
  }

  .charts-row {
    margin-bottom: 16px;
  }

  .hot-goods-card {
    margin-bottom: 16px;
  }
}
</style>
