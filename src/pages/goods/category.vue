<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { type CreateGoodsMenuParams, type GoodsMenu, createGoodsMenu, getGoodsMenuList } from '~/api/goods'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const categoryList = ref<GoodsMenu[]>([])
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<CreateGoodsMenuParams>({
  name: '',
  description: '',
  level: 1,
  sort: 1,
})

// 表格列配置
const columns = [
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '分类描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,

  },
  {
    title: '排序',
    dataIndex: 'sort',
    key: 'sort',
    align: 'center' as const,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
    align: 'center' as const,
  },
]

// 表单验证规则
const rules: Record<string, any> = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度为2-50个字符', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入分类描述', trigger: 'blur' },
    { min: 2, max: 200, message: '分类描述长度为2-200个字符', trigger: 'blur' },
  ],
  level: [
    { required: true, message: '请选择分类级别', trigger: 'change' },
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
    { type: 'number', min: 0, max: 999, message: '排序范围为1-999', trigger: 'blur' },
  ],
}

// 获取分类列表
async function fetchCategoryList() {
  try {
    loading.value = true
    const response = await getGoodsMenuList()

    if (response.code === 200) {
      categoryList.value = response.data || []
    }
    else {
      message.error(response.msg || '获取分类列表失败')
    }
  }
  catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败，请稍后重试')
  }
  finally {
    loading.value = false
  }
}

// 显示新增弹窗
function showAddModal() {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

// 处理编辑
function handleEdit(record: Record<string, any>) {
  isEdit.value = true
  modalVisible.value = true

  // 填充表单数据
  Object.assign(formData, {
    name: record.name,
    description: record.description || '',
    level: record.level || 1,
    sort: record.sort || 1,
  })
}

// 处理删除
function handleDelete(_id: string) {
  // 这里可以添加删除接口调用
  message.info('删除功能待实现')
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitLoading.value = true

    if (isEdit.value) {
      // 编辑逻辑待实现
      message.info('编辑功能待实现')
    }
    else {
      // 新增分类
      const response = await createGoodsMenu(formData)

      if (response.code === 200) {
        message.success('新增分类成功')
        modalVisible.value = false
        fetchCategoryList() // 刷新列表
      }
      else {
        message.error(response.msg || '新增分类失败')
      }
    }
  }
  catch (error) {
    console.error('提交失败:', error)
    if (error !== 'validate') {
      message.error('操作失败，请稍后重试')
    }
  }
  finally {
    submitLoading.value = false
  }
}

// 取消弹窗
function handleCancel() {
  modalVisible.value = false
  resetForm()
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    name: '',
    description: '',
    level: 1,
    sort: 1,
  })
  formRef.value?.resetFields()
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCategoryList()
})
</script>

<template>
  <div class="goods-category-container">
    <PageContainer title="商品分类管理">
      <template #extra>
        <a-button type="primary" @click="showAddModal">
          新增分类
        </a-button>
      </template>

      <!-- 分类列表 -->
      <a-spin :spinning="loading">
        <a-table
          :columns="columns"
          :data-source="categoryList"
          :pagination="false"
          row-key="_id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="handleEdit(record)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这个分类吗？"
                  @confirm="handleDelete(record._id)"
                >
                  <a-button type="link" size="small" danger>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-spin>
    </PageContainer>

    <!-- 新增/编辑分类弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      :confirm-loading="submitLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="分类名称" name="name">
          <a-input
            v-model:value="formData.name"
            placeholder="请输入分类名称"
            :maxlength="50"
          />
        </a-form-item>

        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入分类描述"
            :rows="3"
            :maxlength="200"
            show-count
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="排序" name="sort">
              <a-input-number
                v-model:value="formData.sort"
                placeholder="请输入排序"
                :min="0"
                :max="999"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.goods-category-container {
  .empty-state {
    text-align: center;
    padding: 60px 0;
  }
}
</style>
