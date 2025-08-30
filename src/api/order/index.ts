import { usePost } from '~/utils/request'

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 订单商品项接口
export interface OrderItem {
  goodsId: string
  goodsName: string
  goodsImage: string
  price: number
  quantity: number
  subtotal: number
  specifications?: string
}

// 配送地址接口
export interface DeliveryAddress {
  name: string
  phone: string
  address: string
  detail: string
  latitude?: number
  longitude?: number
}

// 订单接口类型定义
export interface Order {
  _id: string
  orderNumber: string
  userId: {
    _id: string
    nickname: string
    phone: string
    avatar?: string
  }
  shopId: {
    _id: string
    shopName: string
    address: string
    contactPhone: string
    logo?: string
  }
  orderItems: OrderItem[]
  deliveryAddress: DeliveryAddress
  deliveryType: string
  deliveryTime: string
  goodsAmount: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
  status: OrderStatus
  paymentStatus: string
  paymentMethod: string
  remark?: string
  deliveryUserId?: {
    _id: string
    nickname: string
    phone: string
    avatar?: string
  }
  orderTime: string
  confirmTime?: string
  completedTime?: string
  cancelledTime?: string
  cancelReason?: string
  paymentExpireTime?: string
  createTime: string
  updateTime: string
}

// 分页信息接口
export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

// 订单列表响应接口
export interface OrderListResponse {
  orders: Order[]
  pagination: Pagination
}

// 订单统计接口
export interface OrderStatistics {
  summary: {
    totalOrders: number
    totalAmount: number
    avgOrderAmount: number
    completedOrders: number
  }
  statusStats: {
    pending: number
    confirmed: number
    preparing: number
    delivering: number
    completed: number
    cancelled: number
  }
  hotGoods: Array<{
    _id: string
    goodsName: string
    totalQuantity: number
    totalAmount: number
  }>
  trendData: Array<{
    time: string
    orders: number
  }>
  dateRange: {
    startDate: string
    endDate: string
  }
}

// 获取订单列表参数接口
export interface GetOrderListParams {
  status?: OrderStatus
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  orderNumber?: string
}

// 更新订单状态参数接口
export interface UpdateOrderStatusParams {
  orderId: string
  status: OrderStatus
  cancelReason?: string
}

// 批量更新订单参数接口
export interface BatchUpdateOrderParams {
  orderIds: string[]
  action: 'confirm' | 'cancel' | 'start_preparing'
  cancelReason?: string
}

// 订单统计参数接口
export interface GetOrderStatisticsParams {
  startDate?: string
  endDate?: string
  type?: 'day' | 'week' | 'month'
}

/**
 * 获取订单列表
 */
export function getOrderList(params?: GetOrderListParams) {
  return usePost<OrderListResponse>('/order/shop/orders', params)
}

/**
 * 获取订单详情
 */
export function getOrderDetail(orderId: string) {
  return usePost<Order>('/order/shop/detail', { orderId })
}

/**
 * 更新订单状态
 */
export function updateOrderStatus(params: UpdateOrderStatusParams) {
  return usePost('/order/shop/update-status', params)
}

/**
 * 获取订单统计
 */
export function getOrderStatistics(params?: GetOrderStatisticsParams) {
  return usePost<OrderStatistics>('/order/shop/statistics', params)
}

/**
 * 批量处理订单
 */
export function batchUpdateOrders(params: BatchUpdateOrderParams) {
  return usePost('/api/order/shop/batch-update', params)
}
