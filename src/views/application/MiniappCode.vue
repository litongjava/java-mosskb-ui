<template>
  <LayoutContainer header="微信小程序码">
    <div class="miniapp-code p-16" v-loading="loading">
      <el-alert
        title="每个智能提示都可以生成独立的小程序码，用户扫码后直接打开小程序并与该智能提示对话。"
        type="info"
        :closable="false"
        class="mb-16"
      />
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>小程序码</span>
            <div>
              <el-select v-model="envVersion" size="small" class="mr-8" @change="loadCode">
                <el-option label="开发版" value="develop" />
                <el-option label="体验版" value="trial" />
                <el-option label="正式版" value="release" />
              </el-select>
              <el-button size="small" @click="loadCode">重新生成</el-button>
            </div>
          </div>
        </template>
        <div v-if="codeImage" class="code-content">
          <img :src="codeImage" alt="微信小程序码" class="code-image" />
          <div class="code-meta">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="智能提示">{{ applicationName || '—' }}</el-descriptions-item>
              <el-descriptions-item label="scene">{{ code.scene || '—' }}</el-descriptions-item>
              <el-descriptions-item label="页面">{{ code.page || '—' }}</el-descriptions-item>
              <el-descriptions-item label="环境">
                {{ envVersionText }}
              </el-descriptions-item>
            </el-descriptions>
            <div class="mt-16">
              <el-button type="primary" @click="downloadCode">下载小程序码</el-button>
              <el-button :disabled="!code.scene" @click="copy(code.scene, 'scene 已复制')">复制 scene</el-button>
            </div>
            <p class="tip mt-16">
              scene 是当前智能提示的公开访问令牌，重置分享链接后旧的小程序码会自动失效，需要重新生成。
            </p>
          </div>
        </div>
        <el-empty v-else :description="emptyText" />
      </el-card>
    </div>
  </LayoutContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import applicationApi from '@/api/application'
import { MsgSuccess } from '@/utils/message'

const route = useRoute()
/** 应用标识来自路由参数，全程按字符串使用 */
const applicationId = computed(() => String(route.params.id || ''))
const loading = ref(false)
const code = ref<Record<string, any>>({})
const envVersion = ref('develop')
const emptyText = ref('暂无小程序码，请重新生成')

const codeImage = computed(() => {
  const base64 = code.value.image_base64
  if (!base64) {
    return ''
  }
  return `data:${code.value.content_type || 'image/png'};base64,${base64}`
})
const applicationName = computed(() => code.value.application_name || '')
const envVersionText = computed(() => {
  const map: Record<string, string> = { release: '正式版', trial: '体验版', develop: '开发版' }
  return map[code.value.env_version] || code.value.env_version || '—'
})

function loadCode() {
  if (!applicationId.value) {
    return
  }
  applicationApi
    .getMiniappCode(
      {
        application_id: applicationId.value,
        env_version: envVersion.value,
        // 开发版与体验版页面尚未发布，跳过页面校验才能扫码打开
        check_path: envVersion.value === 'release'
      },
      loading
    )
    .then((result: any) => {
      code.value = result || {}
      emptyText.value = code.value.image_base64 ? '' : '暂无小程序码，请重新生成'
    })
    .catch((error: any) => {
      // 失败原因优先用服务端返回的说明，其次用通用文案
      emptyText.value =
        error?.response?.data?.msg || error?.msg || error?.message || '生成小程序码失败，请稍后重试'
      code.value = {}
    })
}

function downloadCode() {
  if (!codeImage.value) {
    return
  }
  const anchor = document.createElement('a')
  anchor.href = codeImage.value
  anchor.download = `miniapp-${code.value.scene || applicationId.value}.png`
  anchor.click()
}

async function copy(value: string, message: string) {
  if (!value) {
    return
  }
  await navigator.clipboard.writeText(value)
  MsgSuccess(message)
}

onMounted(loadCode)
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.code-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.code-image {
  width: 280px;
  height: 280px;
  object-fit: contain;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.code-meta {
  min-width: 360px;
}
.tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}
@media (max-width: 768px) {
  .code-content {
    flex-direction: column;
  }
  .code-meta {
    min-width: 0;
    width: 100%;
  }
}
</style>
