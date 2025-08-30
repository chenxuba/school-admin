<script setup lang="ts">
const router = useRouter()
const userStore = useUserStore()

async function back() {
  try {
    // 退出登录
    await userStore.logout()
    // 跳转到登录页面
    router.replace({
      path: '/login',
    })
  }
  catch (error) {
    console.error('退出登录失败:', error)
    // 即使退出失败也跳转到登录页面
    router.replace({
      path: '/login',
    })
  }
}
</script>

<template>
  <a-result status="404" title="404" sub-title="对不起，当前访问的页面不存在！">
    <template #extra>
      <a-button type="primary" @click="back">
        退出登录并返回首页
      </a-button>
    </template>
  </a-result>
</template>
