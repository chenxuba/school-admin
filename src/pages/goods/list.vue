<template>
  <div class="goods-list-container">
    <PageContainer title="商品列表">
      <template #extra>
        <a-button type="primary" @click="goToAddGoods">
          新增商品
        </a-button>
      </template>
      
      <!-- 搜索和筛选区域 -->
      <div class="search-section mb-4">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索商品名称"
              enter-button="搜索"
              @search="handleSearch"
            />
          </a-col>
          <a-col :span="5">
            <a-select
              v-model:value="selectedMenuId"
              placeholder="选择商品分类"
              allow-clear
              @change="handleCategoryChange"
              :loading="menuLoading"
              class="w-100%"
            >
              <a-select-option value="">全部分类</a-select-option>
              <a-select-option
                v-for="menu in menuList"
                :key="menu._id"
                :value="menu._id"
              >
                {{ menu.name }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-button @click="handleReset">
              重置
            </a-button>
          </a-col>
        </a-row>
      </div>

      <!-- 商品列表 -->
      <a-spin :spinning="loading">
        <div class="goods-grid">
          <div
            v-for="item in goodsList"
            :key="item._id"
            class="goods-col"
          >
            <a-card
              hoverable
              class="goods-card"
              :body-style="{ padding: '12px' }"
            >
              <template #cover>
                <div class="goods-image-wrapper">
                  <img
                    :src="item.thumbnail"
                    :alt="item.name"
                    class="goods-image"
                    @error="handleImageError"
                  >
                  <div v-if="item.isRecommend" class="recommend-badge">
                    推荐
                  </div>
                </div>
              </template>
              
              <a-card-meta>
                <template #title>
                  <div class="goods-title" :title="item.name">
                    {{ item.name }}
                  </div>
                </template>
                
                <template #description>
                  <div class="goods-info">
                    <div class="price-section">
                      <span class="current-price">¥{{ item.price }}</span>
                      <span v-if="item.originalPrice > item.price" class="original-price">
                        ¥{{ item.originalPrice }}
                      </span>
                    </div>
                    
                    <div class="stock-sales">
                      <span class="stock">库存: {{ item.stock }}</span>
                      <span class="sales">销量: {{ item.sales }}</span>
                    </div>
                   <div class="flex justify-between items-center mb-12px">
                    <div class="category">
                      <a-tag color="blue">{{ item.menuName }}</a-tag>
                    </div>
                    
                    <div class="status">
                      <a-tag :color="item.status === 1 ? 'green' : 'red'" class="m-0">
                        {{ item.status === 1 ? '上架' : '下架' }}
                      </a-tag>
                    </div>
                   </div>
                    
                    <div class="description" :title="item.description">
                      {{ item.description }}
                    </div>
                  </div>
                </template>
              </a-card-meta>
            </a-card>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && goodsList.length === 0" class="empty-state">
          <a-empty description="暂无商品数据" />
        </div>
      </a-spin>

      <!-- 分页 -->
      <div v-if="pagination && pagination.totalItems > 0" class="pagination-wrapper">
        <a-pagination
          v-model:current="pagination.currentPage"
          :total="pagination.totalItems"
          :page-size="pagination.itemsPerPage"
          :show-total="showTotal"
          show-size-changer
          show-quick-jumper
          @change="handlePageChange"
          @show-size-change="handlePageSizeChange"
        />
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getGoodsList, getGoodsMenuList, type GoodsItem, type Pagination, type GoodsMenu } from '~/api/goods'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const menuLoading = ref(false)
const goodsList = ref<GoodsItem[]>([])
const menuList = ref<GoodsMenu[]>([])
const searchKeyword = ref('')
const selectedMenuId = ref('')
const pagination = ref<Pagination | null>(null)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  name: '',
  menuId: ''
})

// 获取商品列表
const fetchGoodsList = async () => {
  try {
    loading.value = true
    const params = {
      page: queryParams.page,
      limit: queryParams.limit,
      ...(queryParams.name && { name: queryParams.name }),
      ...(queryParams.menuId && { menuId: queryParams.menuId })
    }
    
    const response = await getGoodsList(params)
    
    if (response.code === 200) {
      goodsList.value = response.data?.goods || []
      pagination.value = response.data?.pagination || null
    } else {
      message.error(response.msg || '获取商品列表失败')
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    message.error('获取商品列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 获取商品分类列表
const fetchGoodsMenuList = async () => {
  try {
    menuLoading.value = true
    const response = await getGoodsMenuList()
    
    if (response.code === 200) {
      menuList.value = response.data || []
    } else {
      message.error(response.msg || '获取商品分类失败')
    }
  } catch (error) {
    console.error('获取商品分类失败:', error)
    message.error('获取商品分类失败，请稍后重试')
  } finally {
    menuLoading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  queryParams.name = searchKeyword.value
  queryParams.page = 1
  fetchGoodsList()
}

// 分类筛选处理
const handleCategoryChange = () => {
  queryParams.menuId = selectedMenuId.value
  queryParams.page = 1
  fetchGoodsList()
}

// 重置处理
const handleReset = () => {
  searchKeyword.value = ''
  selectedMenuId.value = ''
  queryParams.name = ''
  queryParams.menuId = ''
  queryParams.page = 1
  fetchGoodsList()
}

// 分页变化处理
const handlePageChange = (page: number) => {
  queryParams.page = page
  fetchGoodsList()
}

// 页面大小变化处理
const handlePageSizeChange = (current: number, size: number) => {
  queryParams.page = current
  queryParams.limit = size
  fetchGoodsList()
}

// 分页显示总数的函数
const showTotal = (total: number, range: [number, number]) => {
  return `共 ${total} 条记录，第 ${range[0]}-${range[1]} 条`
}

// 跳转到新增商品页面
const goToAddGoods = () => {
  router.push('/goods/add')
}

// 图片加载错误处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWKoOi9vTwvdGV4dD4KPC9zdmc+'
}

// 组件挂载时获取数据
onMounted(() => {
  fetchGoodsList()
  fetchGoodsMenuList()
})
</script>

<style lang="less" scoped>
.goods-list-container {
  .search-section {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .goods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .goods-col {
    display: flex;
    flex-direction: column;
  }

  .goods-card {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    flex: 1;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .goods-image-wrapper {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;

      .goods-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }

      .recommend-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ff4d4f;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    .goods-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 8px;
    }

    .goods-info {
      .price-section {
        margin-bottom: 8px;

        .current-price {
          font-size: 16px;
          font-weight: 600;
          color: #ff4d4f;
          margin-right: 8px;
        }

        .original-price {
          font-size: 12px;
          color: #999;
          text-decoration: line-through;
        }
      }

      .stock-sales {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;

        .stock {
          color: #52c41a;
        }

        .sales {
          color: #1890ff;
        }
      }

     
      .description {
        font-size: 12px;
        color: #999;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 0;
  }

  .pagination-wrapper {
    margin-top: 24px;
    text-align: center;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}
</style>
