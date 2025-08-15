<template>
  <div class="edit-goods-container">
    <PageContainer :title="isEditMode ? '编辑商品' : '新增商品'">
      <template #extra>
        <a-button @click="goBack">
          返回列表
        </a-button>
      </template>

      <div class="form-container">
        <a-spin :spinning="pageLoading">
          <a-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 16 }"
            @finish="handleSubmit"
          >
            <a-form-item label="商品名称" name="name">
              <a-input
                v-model:value="formData.name"
                placeholder="请输入商品名称"
                :maxlength="100"
              />
            </a-form-item>

            <a-form-item label="商品描述" name="description">
              <a-textarea
                v-model:value="formData.description"
                placeholder="请输入商品描述"
                :rows="4"
                :maxlength="500"
                show-count
              />
            </a-form-item>

            <a-form-item label="商品分类" name="menuId">
              <a-select
                v-model:value="formData.menuId"
                placeholder="请选择商品分类"
                :loading="menuLoading"
              >
                <a-select-option
                  v-for="menu in menuList"
                  :key="menu._id"
                  :value="menu._id"
                >
                  {{ menu.name }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="商品价格" name="price">
              <a-input-number
                v-model:value="formData.price"
                placeholder="请输入商品价格"
                :min="0"
                :precision="2"
                style="width: 200px"
              />
              <span class="ml-2 text-gray-500">元</span>
            </a-form-item>

            <a-form-item label="原价" name="originalPrice">
              <a-input-number
                v-model:value="formData.originalPrice"
                placeholder="请输入原价"
                :min="0"
                :precision="2"
                style="width: 200px"
              />
              <span class="ml-2 text-gray-500">元（可选，用于显示折扣）</span>
            </a-form-item>

            <a-form-item label="库存数量" name="stock">
              <a-input-number
                v-model:value="formData.stock"
                placeholder="请输入库存数量"
                :min="0"
                style="width: 200px"
              />
              <span class="ml-2 text-gray-500">件</span>
            </a-form-item>

            <a-form-item label="商品状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio :value="1">上架</a-radio>
                <a-radio :value="0">下架</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="推荐商品" name="isRecommend">
              <a-switch v-model:checked="formData.isRecommend" />
              <span class="ml-2 text-gray-500">推荐商品会在首页展示</span>
            </a-form-item>

            <a-form-item label="单点不送" name="noSingleDelivery">
              <a-switch v-model:checked="formData.noSingleDelivery" />
              <span class="ml-2 text-gray-500">开启后该商品不支持单点配送</span>
            </a-form-item>

            <a-form-item label="缩略图" name="thumbnail">
              <div class="image-upload-section">
                <a-input
                  v-model:value="formData.thumbnail"
                  placeholder="请输入缩略图URL"
                  class="mb-2"
                />
                <div v-if="formData.thumbnail" class="image-preview">
                  <img :src="formData.thumbnail" alt="缩略图预览" class="preview-image" />
                </div>
              </div>
            </a-form-item>

            <a-form-item label="商品图片" name="images">
              <div class="images-upload-section">
                <div v-for="(image, index) in formData.images" :key="index" class="image-input-item">
                  <a-form-item-rest>
                    <a-input
                      v-model:value="formData.images[index]"
                      :placeholder="`请输入第${index + 1}张图片URL`"
                      class="mb-2"
                    />
                  </a-form-item-rest>
                  <a-button
                    type="text"
                    danger
                    size="small"
                    @click="removeImage(index)"
                  >
                    删除
                  </a-button>
                  <div v-if="image" class="image-preview">
                    <img :src="image" :alt="`商品图片${index + 1}`" class="preview-image" />
                  </div>
                </div>
                <a-button type="dashed" @click="addImage" class="add-image-btn">
                  + 添加图片
                </a-button>
              </div>
            </a-form-item>

            <a-form-item label="商品规格" name="specifications">
              <div class="specifications-section">
                <div v-for="(spec, specIndex) in formData.specifications" :key="specIndex" class="specification-item">
                  <div class="spec-header">
                    <a-form-item-rest>
                      <a-input
                        v-model:value="formData.specifications[specIndex].name"
                        placeholder="请输入规格名称（如：颜色、尺寸等）"
                        style="width: 200px; margin-right: 8px"
                      />
                    </a-form-item-rest>
                    <a-button
                      type="text"
                      danger
                      size="small"
                      @click="removeSpecification(specIndex)"
                    >
                      删除规格
                    </a-button>
                  </div>
                  <div class="spec-values">
                    <div v-for="(_, valueIndex) in spec.values" :key="valueIndex" class="spec-value-item">
                      <a-form-item-rest>
                        <a-input
                          v-model:value="formData.specifications[specIndex].values[valueIndex]"
                          placeholder="请输入规格值"
                          style="width: 150px; margin-right: 8px"
                        />
                      </a-form-item-rest>
                      <a-button
                        type="text"
                        danger
                        size="small"
                        @click="removeSpecValue(specIndex, valueIndex)"
                      >
                        删除
                      </a-button>
                    </div>
                    <a-button
                      type="dashed"
                      size="small"
                      @click="addSpecValue(specIndex)"
                      class="add-spec-value-btn"
                    >
                      + 添加规格值
                    </a-button>
                  </div>
                </div>
                <a-button type="dashed" @click="addSpecification" class="add-specification-btn">
                  + 添加规格
                </a-button>
                <div class="spec-tip">
                  <a-typography-text type="secondary">
                    提示：规格用于区分同一商品的不同变体，如颜色、尺寸等。每个规格可以有多个值。
                  </a-typography-text>
                </div>
              </div>
            </a-form-item>

            <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
              <a-space>
                <a-button type="primary" html-type="submit" :loading="submitLoading">
                  {{ isEditMode ? '更新' : '提交' }}
                </a-button>
                <a-button @click="resetForm">
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-spin>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { 
  createGoods, 
  updateGoods,
  getGoodsDetail,
  getGoodsMenuList, 
  type CreateGoodsParams, 
  type UpdateGoodsParams,
  type GoodsMenu 
} from '~/api/goods'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const menuLoading = ref(false)
const pageLoading = ref(false)
const menuList = ref<GoodsMenu[]>([])

// 判断是否为编辑模式
const isEditMode = computed(() => {
  return route.path.includes('/edit/') && route.params.id
})

// 获取商品ID
const goodsId = computed(() => {
  return route.params.id as string
})

// 表单数据
const formData = reactive<CreateGoodsParams & UpdateGoodsParams>({
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  images: [''],
  thumbnail: '',
  stock: 0,
  status: 1,
  menuId: undefined,
  isRecommend: false,
  noSingleDelivery: false,
  specifications: []
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '商品名称长度在1到100个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入商品描述', trigger: 'blur' },
    { min: 1, max: 500, message: '商品描述长度在1到500个字符', trigger: 'blur' }
  ],
  menuId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '商品价格不能小于0', trigger: 'blur' }
  ],
  originalPrice: [
    { type: 'number', min: 0, message: '原价不能小于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存数量不能小于0', trigger: 'blur' }
  ],
  thumbnail: [
    { required: true, message: '请输入缩略图URL', trigger: 'blur' },
    { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
  ],
  images: [
    { required: true, message: '请至少添加一张商品图片', trigger: 'blur' }
  ]
}

// 获取商品详情（编辑模式）
const fetchGoodsDetail = async () => {
  if (!isEditMode.value) return
  
  try {
    pageLoading.value = true
    const response = await getGoodsDetail(goodsId.value)
    
    if (response.code === 200 && response.data) {
      const goods = response.data
      Object.assign(formData, {
        name: goods.name,
        description: goods.description,
        price: goods.price,
        originalPrice: goods.originalPrice,
        images: goods.images && goods.images.length > 0 ? goods.images : [''],
        thumbnail: goods.thumbnail,
        stock: goods.stock,
        status: goods.status,
        menuId: goods.menuId,
        isRecommend: goods.isRecommend,
        noSingleDelivery: goods.noSingleDelivery || false,
        specifications: goods.specifications || []
      })
    } else {
      message.error(response.msg || '获取商品详情失败')
      router.push('/goods/list')
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    message.error('获取商品详情失败，请稍后重试')
    router.push('/goods/list')
  } finally {
    pageLoading.value = false
  }
}

// 获取商品分类列表
const fetchMenuList = async () => {
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

// 添加图片输入框
const addImage = () => {
  formData.images.push('')
}

// 删除图片输入框
const removeImage = (index: number) => {
  if (formData.images.length > 1) {
    formData.images.splice(index, 1)
  } else {
    message.warning('至少保留一张图片')
  }
}

// 添加规格
const addSpecification = () => {
  formData.specifications!.push({
    name: '',
    values: ['']
  })
}

// 删除规格
const removeSpecification = (specIndex: number) => {
  if (formData.specifications && formData.specifications.length > 0) {
    formData.specifications.splice(specIndex, 1)
  }
}

// 添加规格值
const addSpecValue = (specIndex: number) => {
  if (formData.specifications && formData.specifications[specIndex]) {
    formData.specifications[specIndex].values.push('')
  }
}

// 删除规格值
const removeSpecValue = (specIndex: number, valueIndex: number) => {
  if (formData.specifications && formData.specifications[specIndex]) {
    const spec = formData.specifications[specIndex]
    if (spec.values.length > 1) {
      spec.values.splice(valueIndex, 1)
    } else {
      message.warning('每个规格至少保留一个值')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    // 过滤空的图片URL
    const filteredImages = formData.images.filter(img => img.trim())
    if (filteredImages.length === 0) {
      message.error('请至少添加一张有效的商品图片')
      return
    }

    // 处理规格数据，过滤空值
    const filteredSpecifications = formData.specifications
      ?.map(spec => ({
        name: spec.name.trim(),
        values: spec.values.filter(value => value.trim()).map(value => value.trim())
      }))
      .filter(spec => spec.name && spec.values.length > 0) || []

    submitLoading.value = true
    
    const submitData = {
      ...formData,
      images: filteredImages,
      specifications: filteredSpecifications.length > 0 ? filteredSpecifications : undefined
    }
    
    let response
    if (isEditMode.value) {
      response = await updateGoods(goodsId.value, submitData as UpdateGoodsParams)
    } else {
      response = await createGoods(submitData as CreateGoodsParams)
    }
    
    if (response.code === 200) {
      message.success(isEditMode.value ? '商品更新成功' : '商品创建成功')
      router.push('/goods/list')
    } else {
      message.error(response.msg || (isEditMode.value ? '更新商品失败' : '创建商品失败'))
    }
  } catch (error) {
    console.error('操作失败:', error)
    message.error(isEditMode.value ? '更新商品失败，请稍后重试' : '创建商品失败，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (isEditMode.value) {
    // 编辑模式下重置为原始数据
    fetchGoodsDetail()
  } else {
    // 新增模式下重置为空
    formRef.value?.resetFields()
    Object.assign(formData, {
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      images: [''],
      thumbnail: '',
      stock: 0,
      status: 1,
      menuId: undefined,
      isRecommend: false,
      noSingleDelivery: false,
      specifications: []
    })
  }
}

// 返回列表
const goBack = () => {
  router.push('/goods/list')
}

// 组件挂载时初始化数据
onMounted(async () => {
  await fetchMenuList()
  if (isEditMode.value) {
    await fetchGoodsDetail()
  }
})
</script>

<style lang="less" scoped>
.edit-goods-container {
  .form-container {
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .image-upload-section {
    .image-preview {
      margin-top: 8px;
      
      .preview-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #d9d9d9;
      }
    }
  }

  .images-upload-section {
    .image-input-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 16px;
      
      .ant-input {
        flex: 1;
      }
      
      .image-preview {
        margin-top: 8px;
        
        .preview-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #d9d9d9;
        }
      }
    }
    
    .add-image-btn {
      width: 100%;
      height: 60px;
      border: 2px dashed #d9d9d9;
      background: #fafafa;
      color: #999;
      
      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }
    }
  }

  .specifications-section {
    .specification-item {
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fafafa;

      .spec-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        
        .ant-input {
          font-weight: 500;
        }
      }

      .spec-values {
        .spec-value-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .add-spec-value-btn {
          border: 1px dashed #d9d9d9;
          background: #fff;
          color: #666;
          height: 32px;
          
          &:hover {
            border-color: #1890ff;
            color: #1890ff;
          }
        }
      }
    }

    .add-specification-btn {
      width: 100%;
      height: 50px;
      border: 2px dashed #d9d9d9;
      background: #fafafa;
      color: #999;
      margin-bottom: 12px;
      
      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }
    }

    .spec-tip {
      padding: 8px 12px;
      background: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
</style>
