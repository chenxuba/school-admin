<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { type Order, OrderStatus, updateOrderStatus } from '~/api/order'

interface Props {
  order: Order
}

interface Emits {
  (e: 'statusUpdated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const cancelModalVisible = ref(false)
const cancelReason = ref('')

// 商品列表表格列配置
const itemColumns = [
  {
    title: '商品图片',
    key: 'goodsImage',
    width: 80,
  },
  {
    title: '商品名称',
    dataIndex: 'goodsName',
    key: 'goodsName',
  },
  {
    title: '规格',
    dataIndex: 'specifications',
    key: 'specifications',
    width: 150,
  },
  {
    title: '单价',
    key: 'price',
    width: 100,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 80,
  },
  {
    title: '小计',
    key: 'subtotal',
    width: 100,
  },
]

// 更新订单状态
async function handleStatusUpdate(status: string) {
  try {
    loading.value = true
    await updateOrderStatus({
      orderId: props.order._id,
      status: status as OrderStatus,
    })
    message.success('订单状态更新成功')
    emit('statusUpdated')
  }
  catch (error) {
    message.error('订单状态更新失败')
  }
  finally {
    loading.value = false
  }
}

// 显示取消订单模态框
function showCancelModal() {
  cancelModalVisible.value = true
}

// 取消订单
async function handleCancelOrder() {
  if (!cancelReason.value.trim()) {
    message.error('请输入取消原因')
    return
  }

  try {
    loading.value = true
    await updateOrderStatus({
      orderId: props.order._id,
      status: OrderStatus.CANCELLED,
      cancelReason: cancelReason.value,
    })
    message.success('订单取消成功')
    cancelModalVisible.value = false
    cancelReason.value = ''
    emit('statusUpdated')
  }
  catch (error) {
    message.error('订单取消失败')
  }
  finally {
    loading.value = false
  }
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

function getPaymentStatusText(status: string) {
  const textMap: Record<string, string> = {
    unpaid: '未支付',
    paid: '已支付',
    refunded: '已退款',
  }
  return textMap[status] || status
}

function getPaymentMethodText(method: string) {
  const textMap: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金支付',
  }
  return textMap[method] || method || '未选择'
}

function getDeliveryTypeText(type: string | number) {
  const textMap: Record<string | number, string> = {
    0: '立即送达',
    1: '预约配送',
  }
  return textMap[type] || '未知类型'
}

function formatDeliveryTime(time: string) {
  if (!time)
    return '立即送达'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}
</script>

<template>
  <div class="order-detail">
    <a-descriptions title="订单信息" :column="2" bordered>
      <a-descriptions-item label="订单号">
        {{ order.orderNumber }}
      </a-descriptions-item>
      <a-descriptions-item label="订单状态">
        <a-tag :color="getStatusColor(order.status)">
          {{ getStatusText(order.status) }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="下单时间">
        {{ formatTime(order.createTime) }}
      </a-descriptions-item>
      <a-descriptions-item label="订单金额">
        ¥{{ order.totalAmount.toFixed(2) }}
      </a-descriptions-item>
      <a-descriptions-item label="支付状态">
        {{ getPaymentStatusText(order.paymentStatus) }}
      </a-descriptions-item>
      <a-descriptions-item label="支付方式">
        {{ getPaymentMethodText(order.paymentMethod) }}
      </a-descriptions-item>
      <a-descriptions-item v-if="order.status === 'cancelled' && order.cancelReason" label="取消原因" :span="2">
        <span class="text-red-500">{{ order.cancelReason }}</span>
      </a-descriptions-item>
      <a-descriptions-item v-if="order.remark" label="订单备注" :span="2">
        <span class="text-gray-600">{{ order.remark }}</span>
      </a-descriptions-item>
    </a-descriptions>

    <a-divider />

    <a-descriptions title="用户信息" :column="2" bordered>
      <a-descriptions-item label="用户昵称">
        {{ order.userId.nickname }}
      </a-descriptions-item>
      <a-descriptions-item label="联系电话">
        {{ order.userId.phone }}
      </a-descriptions-item>
    </a-descriptions>

    <a-divider />

    <a-descriptions title="配送信息" :column="1" bordered>
      <a-descriptions-item label="收货人">
        {{ order.deliveryAddress.name }}
      </a-descriptions-item>
      <a-descriptions-item label="联系电话">
        {{ order.deliveryAddress.phone }}
      </a-descriptions-item>
      <a-descriptions-item label="配送地址">
        {{ order.deliveryAddress.address }} {{ order.deliveryAddress.detail }}
      </a-descriptions-item>
      <a-descriptions-item label="配送类型">
        {{ getDeliveryTypeText(order.deliveryType) }}
      </a-descriptions-item>
      <a-descriptions-item label="期望送达时间">
        {{ formatDeliveryTime(order.deliveryTime) }}
      </a-descriptions-item>
    </a-descriptions>

    <a-divider />

    <div class="order-items">
      <h3>商品信息</h3>
      <a-table
        :columns="itemColumns"
        :data-source="order.orderItems"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'goodsImage'">
            <a-image :src="record.image" :width="100" />
          </template>
          <template v-if="column.key === 'specifications'">
            <span v-if="record.specs">{{ record.specs }}</span>
            <span v-else class="text-gray-400">无规格</span>
          </template>
          <template v-if="column.key === 'price'">
            ¥{{ record.price.toFixed(2) }}
          </template>
          <template v-if="column.key === 'subtotal'">
            ¥{{ record.subtotal.toFixed(2) }}
          </template>
        </template>
      </a-table>
    </div>

    <a-divider />

    <div class="order-summary">
      <a-row justify="end">
        <a-col span="8">
          <div class="summary-item">
            <span>商品总额：</span>
            <span>¥{{ order.goodsAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>配送费：</span>
            <span>¥{{ order.deliveryFee.toFixed(2) }}</span>
          </div>
          <div v-if="order.discountAmount > 0" class="summary-item">
            <span>优惠金额：</span>
            <span>-¥{{ order.discountAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item total">
            <span>订单总额：</span>
            <span>¥{{ order.totalAmount.toFixed(2) }}</span>
          </div>
        </a-col>
      </a-row>
    </div>

    <a-divider />

    <div v-if="canUpdateStatus(order.status)" class="order-actions">
      <a-space>
        <a-button v-if="order.status === 'pending'" type="primary" @click="handleStatusUpdate('confirmed')">
          确认订单
        </a-button>
        <a-button v-if="order.status === 'confirmed'" type="primary" @click="handleStatusUpdate('preparing')">
          开始制作
        </a-button>
        <a-button v-if="order.status === 'preparing'" type="primary" @click="handleStatusUpdate('delivering')">
          开始配送
        </a-button>
        <a-button v-if="order.status === 'delivering'" type="primary" @click="handleStatusUpdate('completed')">
          完成订单
        </a-button>
        <a-button v-if="['pending', 'confirmed', 'preparing'].includes(order.status)" danger @click="showCancelModal">
          取消订单
        </a-button>
      </a-space>
    </div>

    <!-- 取消订单模态框 -->
    <a-modal
      v-model="cancelModalVisible"
      title="取消订单"
      :confirm-loading="loading"
      @ok="handleCancelOrder"
    >
      <a-form-item label="取消原因" required>
        <a-textarea
          v-model="cancelReason"
          placeholder="请输入取消原因"
          :rows="4"
        />
      </a-form-item>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.order-detail {
  .order-items {
    h3 {
      margin-bottom: 16px;
    }
  }

  .order-summary {
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      &.total {
        font-weight: 600;
        font-size: 16px;
        color: #f5222d;
        border-top: 1px solid #f0f0f0;
        padding-top: 8px;
        margin-top: 8px;
      }
    }
  }

  .order-actions {
    text-align: center;
  }
}
</style>
