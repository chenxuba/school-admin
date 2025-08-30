import { useDelete, useGet, usePost, usePut } from '~/utils/request'

// 商品规格接口类型定义
export interface Specification {
  name: string
  values: string[]
}

// 商品接口类型定义
export interface GoodsItem {
  _id: string
  name: string
  description: string
  price: number
  originalPrice: number
  images: string[]
  thumbnail: string
  stock: number
  sales: number
  status: number
  isRecommend: boolean
  menuId: string
  shopId: string
  specifications?: Specification[]
  noSingleDelivery?: boolean
  createTime: string
  updateTime: string
  __v: number
  menuName: string
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface GoodsListResponse {
  goods: GoodsItem[]
  pagination: Pagination
}

// 商品分类接口类型定义
export interface GoodsMenu {
  _id: string
  name: string
  description?: string
  level?: number
  sort?: number
  status: number
  createTime: string
  updateTime: string
}

// 新增商品分类参数类型
export interface CreateGoodsMenuParams {
  name: string
  description: string
  level: number
  sort: number
}

// 新增商品参数类型
export interface CreateGoodsParams {
  name: string
  description: string
  price: number
  originalPrice: number
  images: string[]
  thumbnail: string
  stock: number
  status: number
  menuId: string | undefined
  isRecommend: boolean
  specifications?: Specification[]
  noSingleDelivery?: boolean
}

// 更新商品参数类型
export interface UpdateGoodsParams {
  name: string
  description: string
  price: number
  originalPrice: number
  images: string[]
  thumbnail: string
  stock: number
  status: number
  menuId: string | undefined
  isRecommend: boolean
  specifications?: Specification[]
  noSingleDelivery?: boolean
}

// 获取全部商品列表
export function getAllGoods() {
  return useGet<GoodsListResponse>('/goods/shop/all')
}

// 获取商品列表（带分页参数）
export function getGoodsList(params?: {
  page?: number
  limit?: number
  menuId?: string
  keyword?: string
}) {
  return useGet<GoodsListResponse>('/goods/shop/all', params)
}

// 新增商品
export function createGoods(data: CreateGoodsParams) {
  return usePost<GoodsItem>('/goods/create', data)
}

// 获取商品分类列表
export function getGoodsMenuList() {
  return useGet<GoodsMenu[]>('/goodsmenu/list')
}

// 新增商品分类
export function createGoodsMenu(data: CreateGoodsMenuParams) {
  return usePost<GoodsMenu>('/goodsmenu/add', data)
}

// 获取单个商品详情
export function getGoodsDetail(id: string) {
  return useGet<GoodsItem>(`/goods/${id}`)
}

// 更新商品
export function updateGoods(id: string, data: UpdateGoodsParams) {
  return usePut<GoodsItem>(`/goods/${id}`, data)
}

// 删除商品
export function deleteGoods(id: string) {
  return useDelete(`/goods/${id}`)
}
