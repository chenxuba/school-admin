<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons-vue'
import type { TableColumnsType, TableProps } from 'ant-design-vue'
import dayjs from 'dayjs'
import OrderDetail from './components/OrderDetail.vue'
import {
  type GetOrderListParams,
  type Order,
  OrderStatus,
  batchUpdateOrders,
  getOrderDetail,
  getOrderList,
  updateOrderStatus,
} from '~/api/order'

// 响应式数据
const loading = ref(false)
const batchLoading = ref(false)
const detailLoading = ref(false)
const cancelLoading = ref(false)
const orderList = ref<Order[]>([])
const currentOrder = ref<Order | null>(null)
const detailDrawerVisible = ref(false)
const cancelModalVisible = ref(false)
const cancelReason = ref('')
const currentCancelOrder = ref<Order | null>(null)
const selectedRowKeys = ref<(string | number)[]>([])
const dateRange = ref<any>(null)

// 计算属性：确保currentOrder类型安全
const validCurrentOrder = computed(() => {
  if (currentOrder.value && currentOrder.value._id) {
    return currentOrder.value as Order
  }
  return null
})

// 搜索表单
const searchForm = reactive<GetOrderListParams>({
  status: undefined,
  page: 1,
  limit: 10,
  orderNumber: '',
  startDate: '',
  endDate: '',
})

// 分页配置
const paginationConfig = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '订单号',
    dataIndex: 'orderNumber',
    key: 'orderNumber',
    width: 200,
    fixed: 'left',
  },
  {
    title: '商品信息',
    key: 'orderItems',
    width: 250,
  },
  {
    title: '用户信息',
    dataIndex: ['userId', 'nickname'],
    key: 'userId',
    width: 150,
  },
  {
    title: '订单金额',
    key: 'totalAmount',
    width: 120,
    sorter: true,
  },
  {
    title: '订单状态',
    key: 'status',
    width: 120,
  },
  {
    title: '下单时间',
    key: 'createTime',
    width: 180,
    sorter: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
]

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = keys
  },
  getCheckboxProps: (record: Order) => ({
    disabled: !['pending', 'confirmed', 'preparing'].includes(record.status),
  }),
}))

// 获取订单列表
async function fetchOrderList() {
  try {
    loading.value = true
    const response = await getOrderList(searchForm)
    if (response.data) {
      orderList.value = response.data.orders
      paginationConfig.value.total = response.data.pagination.total
      paginationConfig.value.current = response.data.pagination.page
    }
  }
  catch (error) {
    message.error('获取订单列表失败')
  }
  finally {
    loading.value = false
  }
}

// 搜索处理
function handleSearch() {
  searchForm.page = 1
  paginationConfig.value.current = 1
  fetchOrderList()
}

// 重置搜索
function handleReset() {
  Object.assign(searchForm, {
    status: undefined,
    page: 1,
    limit: 10,
    orderNumber: '',
    startDate: '',
    endDate: '',
  })
  dateRange.value = null
  paginationConfig.value.current = 1
  fetchOrderList()
}

// 日期范围变化处理
function handleDateChange(dates: any) {
  if (dates && dates.length === 2) {
    searchForm.startDate = dayjs(dates[0]).format('YYYY-MM-DD')
    searchForm.endDate = dayjs(dates[1]).format('YYYY-MM-DD')
  }
  else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
}

// 表格变化处理
const handleTableChange: TableProps['onChange'] = (pagination, _filters, _sorter) => {
  if (pagination) {
    searchForm.page = pagination.current || 1
    searchForm.limit = pagination.pageSize || 10
    paginationConfig.value.current = pagination.current || 1
    paginationConfig.value.pageSize = pagination.pageSize || 10
  }
  fetchOrderList()
}

// 查看订单详情
async function handleViewDetail(orderId: string) {
  console.log('点击查看详情，订单ID:', orderId)
  try {
    detailLoading.value = true
    detailDrawerVisible.value = true
    console.log('开始调用API获取订单详情')
    const response = await getOrderDetail(orderId)
    console.log('API响应:', response)
    if (response.data) {
      // 直接使用API返回的数据，它应该已经符合Order类型
      currentOrder.value = response.data
      console.log('设置currentOrder:', response.data)
    }
    else {
      console.log('API响应中没有data字段')
      message.error('获取订单详情失败：数据为空')
      detailDrawerVisible.value = false
    }
  }
  catch (error) {
    console.error('获取订单详情出错:', error)
    message.error('获取订单详情失败')
    detailDrawerVisible.value = false
  }
  finally {
    detailLoading.value = false
  }
}

// 状态变更处理
function handleStatusChange(order: any, status: string | number) {
  const statusStr = String(status)
  if (statusStr === 'cancelled') {
    currentCancelOrder.value = order as Order
    cancelModalVisible.value = true
  }
  else {
    updateStatus(order._id, statusStr as OrderStatus)
  }
}

// 更新订单状态
async function updateStatus(orderId: string, status: OrderStatus, cancelReason?: string) {
  try {
    await updateOrderStatus({ orderId, status, cancelReason })
    message.success('订单状态更新成功')
    fetchOrderList()
  }
  catch (error) {
    message.error('订单状态更新失败')
  }
}

// 确认取消订单
async function handleConfirmCancel() {
  if (!cancelReason.value.trim()) {
    message.error('请输入取消原因')
    return
  }

  try {
    cancelLoading.value = true
    await updateStatus(currentCancelOrder.value!._id, OrderStatus.CANCELLED, cancelReason.value)
    cancelModalVisible.value = false
    cancelReason.value = ''
    currentCancelOrder.value = null
  }
  finally {
    cancelLoading.value = false
  }
}

// 批量确认订单
async function handleBatchConfirm() {
  try {
    batchLoading.value = true
    await batchUpdateOrders({
      orderIds: selectedRowKeys.value.map(String),
      action: 'confirm',
    })
    message.success('批量确认成功')
    selectedRowKeys.value = []
    fetchOrderList()
  }
  catch (error) {
    message.error('批量确认失败')
  }
  finally {
    batchLoading.value = false
  }
}

// 批量取消订单
async function handleBatchCancel() {
  try {
    batchLoading.value = true
    await batchUpdateOrders({
      orderIds: selectedRowKeys.value.map(String),
      action: 'cancel',
      cancelReason: '商家批量取消',
    })
    message.success('批量取消成功')
    selectedRowKeys.value = []
    fetchOrderList()
  }
  catch (error) {
    message.error('批量取消失败')
  }
  finally {
    batchLoading.value = false
  }
}

// 状态更新回调
function handleStatusUpdated() {
  fetchOrderList()
  detailDrawerVisible.value = false
}

// 工具函数
function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    pending: 'orange',
    confirmed: 'blue',
    preparing: 'cyan',
    delivering: 'purple',
    completed: 'green',
    cancelled: 'red',
  }
  return colorMap[status] || 'default'
}

function getStatusText(status: string) {
  const textMap: Record<string, string> = {
    pending: '待支付',
    confirmed: '待确认',
    preparing: '制作中',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return textMap[status] || status
}

function canUpdateStatus(status: string) {
  return !['completed', 'cancelled'].includes(status)
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchOrderList()
})
</script>

<template>
  <div class="order-list-container">
    <a-card :bordered="false">
      <!-- 搜索筛选区域 -->
      <div class="search-form">
        <a-form layout="inline" :model="searchForm" @finish="handleSearch">
          <a-form-item label="订单状态">
            <a-select
              v-model:value="searchForm.status"
              placeholder="请选择订单状态"
              style="width: 150px"
              allow-clear
            >
              <a-select-option value="pending">
                待支付
              </a-select-option>
              <a-select-option value="confirmed">
                待确认
              </a-select-option>
              <a-select-option value="preparing">
                制作中
              </a-select-option>
              <a-select-option value="delivering">
                配送中
              </a-select-option>
              <a-select-option value="completed">
                已完成
              </a-select-option>
              <a-select-option value="cancelled">
                已取消
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="订单号">
            <a-input
              v-model:value="searchForm.orderNumber"
              placeholder="请输入订单号"
              style="width: 200px"
            />
          </a-form-item>

          <a-form-item label="日期范围">
            <a-range-picker
              v-model:value="dateRange"
              format="YYYY-MM-DD"
              @change="handleDateChange"
            />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="loading">
              <SearchOutlined /> 搜索
            </a-button>
            <a-button style="margin-left: 8px" @click="handleReset">
              重置
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 批量操作区域 -->
      <div v-if="selectedRowKeys.length > 0" class="batch-actions">
        <a-space>
          <span>已选择 {{ selectedRowKeys.length }} 项</span>
          <a-button type="primary" :loading="batchLoading" @click="handleBatchConfirm">
            批量确认
          </a-button>
          <a-button :loading="batchLoading" @click="handleBatchCancel">
            批量取消
          </a-button>
        </a-space>
      </div>

      <!-- 订单列表表格 -->
      <a-table
        :columns="columns"
        :data-source="orderList"
        :loading="loading"
        :pagination="false"
        :row-selection="rowSelection"
        row-key="_id"
        size="middle"
        :scroll="{ x: 1200, y: 600 }"
        class="order-table"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'orderNumber'">
            <div>
              <a @click="handleViewDetail(record._id)">{{ record.orderNumber }}</a>
              <div v-if="record.remark" class="order-remark-tip">
                <a-tag color="orange" size="small">
                  <template #icon>
                    <ExclamationCircleOutlined />
                  </template>
                  有备注
                </a-tag>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'orderItems'">
            <div class="order-items">
              <div v-for="item in record.orderItems.slice(0, 2)" :key="item.goodsId" class="item">
                <div class="item-image">
                  <a-image
                    :src="item.image"
                    :width="50"
                    :height="50"
                    :preview="false"
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  />
                </div>
                <div class="item-info">
                  <div class="item-name">
                    {{ item.goodsName }}
                  </div>
                  <div class="item-name" style="color: red;">
                    {{ item.specs }}
                  </div>
                  <div class="item-quantity">
                    x{{ item.quantity }}
                  </div>
                </div>
              </div>
              <div v-if="record.orderItems.length > 2" class="more-items">
                +{{ record.orderItems.length - 2 }}个商品
              </div>
            </div>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'totalAmount'">
            <span class="amount">¥{{ record.totalAmount.toFixed(2) }}</span>
          </template>

          <template v-if="column.key === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>

          <template v-if="column.key === 'action'">
            <a-space direction="vertical" size="small" class="action-buttons">
              <a-button type="link" size="small" class="action-btn" @click="handleViewDetail(record._id)">
                查看详情
              </a-button>
              <a-dropdown v-if="canUpdateStatus(record.status)">
                <template #overlay>
                  <a-menu @click="({ key }) => handleStatusChange(record, key)">
                    <a-menu-item v-if="record.status === 'confirmed'" key="preparing">
                      开始制作
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'preparing'" key="delivering">
                      开始配送
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'delivering'" key="completed">
                      完成订单
                    </a-menu-item>
                    <a-menu-item v-if="['pending', 'confirmed', 'preparing'].includes(record.status)" key="cancelled">
                      取消订单
                    </a-menu-item>
                  </a-menu>
                </template>
                <a-button type="link" size="small" class="action-btn">
                  更新状态
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 订单详情抽屉 -->
    <a-drawer
      :visible="detailDrawerVisible"
      title="订单详情"
      width="800"
      :loading="detailLoading"
      @close="detailDrawerVisible = false"
    >
      <OrderDetail v-if="validCurrentOrder" :order="validCurrentOrder" @status-updated="handleStatusUpdated" />
    </a-drawer>

    <!-- 取消订单模态框 -->
    <a-modal
      :visible="cancelModalVisible"
      title="取消订单"
      :confirm-loading="cancelLoading"
      @ok="handleConfirmCancel"
      @cancel="cancelModalVisible = false"
    >
      <a-form-item label="取消原因" required>
        <a-textarea
          v-model:value="cancelReason"
          placeholder="请输入取消原因"
          :rows="4"
        />
      </a-form-item>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.order-list-container {
  .search-form {
    margin-bottom: 16px;
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
  }

  .batch-actions {
    margin-bottom: 16px;
    padding: 12px;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 6px;
  }

  .order-items {
    .item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding: 4px 0;

      .item-image {
        flex-shrink: 0;
        margin-right: 12px;

        :deep(.ant-image) {
          border-radius: 4px;
          overflow: hidden;

          img {
            object-fit: cover;
            border-radius: 4px;
          }
        }
      }

      .item-info {
        flex: 1;
        min-width: 0;

        .item-name {
          font-size: 13px;
          color: #333;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-quantity {
          font-size: 12px;
          color: #666;
        }
      }
    }

    .more-items {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      padding-left: 62px;
    }
  }

  .amount {
    font-weight: 600;
    color: #f5222d;
  }

  .order-table {
    .ant-table-thead > tr > th {
      background-color: #fafafa;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e8e8e8;
    }

    .ant-table-tbody > tr > td {
      padding: 12px 8px;
      vertical-align: top;
    }

    .ant-table-tbody > tr:hover > td {
      background-color: #f5f7fa;
    }
  }

  .order-number-btn {
    font-weight: 500;
    color: #1890ff;
    padding: 0;
  }

  .goods-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .goods-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .goods-image {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid #e8e8e8;
  }

  .goods-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .goods-name {
    font-size: 14px;
    color: #333;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .goods-quantity {
    font-size: 12px;
    color: #666;
  }

  .more-goods {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
    text-align: center;
    padding: 2px 6px;
    background-color: #f0f0f0;
    border-radius: 12px;
    display: inline-block;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-name {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }

  .user-phone {
    font-size: 12px;
    color: #666;
  }

  .order-amount {
    color: #f5222d;
    font-weight: 600;
    font-size: 16px;
  }

  .status-tag {
    font-weight: 500;
    border-radius: 4px;
  }

  .order-time {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .order-time .date {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }

  .order-time .time {
     font-size: 12px;
     color: #666;
   }

   .action-buttons {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 4px;
   }

   .action-btn {
     padding: 2px 8px;
     height: auto;
     line-height: 1.4;
     font-size: 14px;
     white-space: nowrap;
   }

   .action-btn:hover {
     background-color: #f0f7ff;
     border-radius: 4px;
   }

   .order-remark-tip {
     margin-top: 4px;
   }
}
</style>
