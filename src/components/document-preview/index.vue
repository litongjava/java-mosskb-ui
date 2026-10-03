<template>
  <div v-loading="loading" class="document-preview">
    <div class="document-preview-header flex align-center">
      <span class="document-preview-title">{{ $t('chat.documentPreview.title') }}</span>
      <el-divider direction="vertical" class="mr-8" />
      <img
        v-if="detail.document_name"
        :src="getImgUrl(detail.document_name)"
        alt=""
        width="20"
        class="mr-8"
      />
      <span class="document-preview-name ellipsis-1" :title="detail.document_name">
        {{ detail.document_name }}
      </span>
      <el-tag v-if="detail.document_type" class="ml-8" size="small" type="info">
        {{ detail.document_type }}
      </el-tag>
      <span class="ml-8 color-secondary ellipsis-1" :title="detail.dataset_name">
        {{ detail.dataset_name }}
      </span>
      <span v-if="fileSizeText" class="ml-16 color-secondary">{{ fileSizeText }}</span>
      <div class="document-preview-space"></div>
      <el-button
        type="primary"
        :disabled="!detail.downloadable"
        :loading="downloading"
        @click="downloadDocument"
      >
        <AppIcon iconName="app-export" class="mr-4"></AppIcon>
        {{ $t('chat.documentPreview.download') }}
      </el-button>
    </div>
    <el-alert
      v-if="detail.truncated"
      class="mb-8"
      type="warning"
      :closable="false"
      :title="$t('chat.documentPreview.truncated')"
    />
    <div class="document-preview-body">
      <iframe v-if="previewKind === 'pdf'" :src="previewUrl" class="document-preview-frame" />
      <div v-else-if="previewKind === 'image'" class="document-preview-image">
        <img :src="previewUrl" alt="" />
      </div>
      <!-- 原始 HTML 文件不做任何处理，放进沙箱 iframe，页面里的脚本不会执行 -->
      <iframe
        v-else-if="previewKind === 'web'"
        :srcdoc="detail.content"
        sandbox=""
        class="document-preview-frame"
      />
      <!-- 服务端已经对文档正文做过转义，这里的 HTML 是表格与段落片段 -->
      <div
        v-else-if="previewKind === 'html'"
        class="document-preview-html"
        v-html="detail.content"
      ></div>
      <MdPreview
        v-else-if="previewKind === 'markdown'"
        editorId="document-preview"
        :modelValue="detail.content"
        noImgZoomIn
      />
      <pre v-else-if="previewKind === 'text'" class="document-preview-text">{{
        detail.content
      }}</pre>
      <el-empty v-else-if="!loading" :description="emptyText" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveAs } from 'file-saver'
import { getImgUrl } from '@/utils/utils'
import applicationApi from '@/api/application'
import { MsgError } from '@/utils/message'

const { t, locale } = useI18n({ useScope: 'global' })

const props = defineProps({
  applicationId: {
    type: String,
    default: ''
  },
  documentId: {
    type: String,
    default: ''
  }
})

const loading = ref(false)
const downloading = ref(false)
const detail = ref<any>({})
// PDF 与图片先取回原文件再交给浏览器渲染，本地地址在页面卸载时释放。
const previewUrl = ref('')

const previewKind = computed(() => {
  if (loading.value) {
    return ''
  }
  return (detail.value.preview_kind || '').toLowerCase()
})

/** 无法预览时的提示：服务端只给原因码，文案由界面语言决定。 */
const emptyText = computed(() => {
  if (detail.value.message_code) {
    return t(`chat.documentPreview.message.${detail.value.message_code}`)
  }
  return detail.value.message || t('chat.documentPreview.unsupported')
})

const fileSizeText = computed(() => {
  const size = Number(detail.value.file_size)
  if (!size) {
    return ''
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
})

function load() {
  if (!props.applicationId || !props.documentId) {
    return
  }
  releasePreviewUrl()
  detail.value = {}
  loading.value = true
  applicationApi
    .getDocumentPreviewContent(props.applicationId, props.documentId)
    .then((res: any) => {
      detail.value = res.data || {}
      loadBinaryPreview()
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false
    })
}

/** PDF、图片需要原文件本身，取回二进制后生成浏览器可直接打开的地址。 */
function loadBinaryPreview() {
  const kind = (detail.value.preview_kind || '').toLowerCase()
  if (kind !== 'pdf' && kind !== 'image') {
    return
  }
  applicationApi
    .getDocumentFile(props.applicationId, props.documentId, false)
    .then((blob: any) => {
      if (blob instanceof Blob) {
        previewUrl.value = window.URL.createObjectURL(blob)
      }
    })
    .catch(() => {
      MsgError(t('chat.documentPreview.loadFailed'))
    })
}

function releasePreviewUrl() {
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

function downloadDocument() {
  if (!detail.value.downloadable) {
    return
  }
  downloading.value = true
  applicationApi
    .getDocumentFile(props.applicationId, props.documentId, true)
    .then((blob: any) => {
      if (blob instanceof Blob) {
        saveAs(blob, detail.value.file_name || detail.value.document_name)
      }
    })
    .catch(() => {})
    .finally(() => {
      downloading.value = false
    })
}

watch(() => [props.applicationId, props.documentId], load, { immediate: true })

/**
 * 新标签页的标题用文档名，方便在多个预览页之间切换；
 * 文档信息还没回来时用当前界面语言的「文档预览」，语言切换后标题会跟着更新。
 */
watch(
  [() => detail.value.document_name, locale],
  () => {
    document.title = detail.value.document_name || t('chat.documentPreview.title')
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  releasePreviewUrl()
})
</script>
<style lang="scss" scoped>
.document-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 20px 12px 20px;
  background: var(--el-bg-color);
}

.document-preview-header {
  flex: none;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.document-preview-title {
  flex: none;
  font-size: 16px;
  font-weight: 500;
}

.document-preview-name {
  font-weight: 500;
}

.document-preview-space {
  flex: 1;
  min-width: 8px;
}

.document-preview-body {
  flex: 1;
  min-height: 0;
  padding-top: 12px;
  overflow: auto;
}

.document-preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.document-preview-image {
  text-align: center;

  img {
    max-width: 100%;
  }
}

.document-preview-html {
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;

  :deep(.preview-table) {
    width: 100%;
    margin-bottom: 12px;
    border-collapse: collapse;

    td {
      padding: 6px 8px;
      border: 1px solid var(--el-border-color-lighter);
      vertical-align: top;
    }
  }

  :deep(.preview-blank) {
    margin: 0;
  }
}

.document-preview-text {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
