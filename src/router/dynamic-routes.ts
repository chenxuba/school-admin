import type { RouteRecordRaw } from 'vue-router'
import { basicRouteMap } from './router-modules'

export default [
  {
    path: '/dashboard',
    redirect: '/goods/list',
    name: 'Dashboard',
    meta: {
      title: '店铺管理',
      icon: 'DashboardOutlined',
    },
    component: basicRouteMap.RouteView,
    children: [
      {
        path: '/goods/list',
        name: 'GoodsList',
        component: () => import('~/pages/goods/list.vue'),
        meta: {
          title: '商品列表',
        },
      },
      {
        path: '/goods/add',
        name: 'GoodsAdd',
        component: () => import('~/pages/goods/edit.vue'),
        meta: {
          title: '新增商品',
        },
      },
      {
        path: '/goods/edit/:id',
        name: 'GoodsEdit',
        component: () => import('~/pages/goods/edit.vue'),
        meta: {
          title: '编辑商品',
          hideInMenu: true,
          parentKeys: ['/goods/list'],
        },
      },
      {
        path: '/goods/category',
        name: 'GoodsCategory',
        component: () => import('~/pages/goods/category.vue'),
        meta: {
          title: '商品分类',
        },
      },

    ],
  },
  {
    path: '/order',
    redirect: '/order/list',
    name: 'Order',
    meta: {
      title: '订单管理',
      icon: 'ShoppingCartOutlined',
    },
    component: basicRouteMap.RouteView,
    children: [
      {
        path: '/order/list',
        name: 'OrderList',
        component: () => import('~/pages/order/list.vue'),
        meta: {
          title: '订单列表',
        },
      },
      {
        path: '/order/statistics',
        name: 'OrderStatistics',
        component: () => import('~/pages/order/statistics.vue'),
        meta: {
          title: '订单统计',
        },
      },
    ],
  },
] as RouteRecordRaw[]
