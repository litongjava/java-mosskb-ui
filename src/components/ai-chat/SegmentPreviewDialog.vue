<template>
  <el-dialog
    class="segment-preview responsive-dialog"
    :title="$t('chat.segmentPreview.title')"
    v-model="dialogVisible"
    destroy-on-close
    append-to-body
    align-center
    width="70%"
    :close-on-click-modal="false"
  >
    <div class="segment-preview-header flex align-center">
      <img
        v-if="detail.document_name"
        :src="getImgUrl(detail.document_name)"
        alt=""
        width="20"
        class="mr-8"
      />
      <span
        class="segment-preview-name ellipsis-1"
        :title="$t('chat.documentPreview.clickTip')"
        @click="openDocumentPreview"
      >
        {{ detail.document_name }}
      </span>
      <el-tag v-if="detail.document_type" class="ml-8" size="small" type="info">
        {{ detail.document_type }}
      </el-tag>
      <span class="ml-8 color-secondary ellipsis-1" :title="detail.dataset_name">
        {{ detail.dataset_name }}
      </span>
      <span class="ml-16 color-secondary">
        {{ $t('chat.segmentPreview.segmentCount') }}:
        {{ detail.preview_paragraph_count || 0 }} / {{ detail.paragraph_count || 0 }}
      </span>
      <el-button type="primary" link class="ml-8" @click="openDocumentPreview">
        <AppIcon iconName="app-view" class="mr-4"></AppIcon>
        {{ $t('chat.documentPreview.previewFullText') }}
      </el-button>
    </div>
    <el-alert
      v-if="detail.truncated"
      class="mb-8"
      type="warning"
      :closable="false"
      :title="$t('chat.segmentPreview.truncated')"
    />
    <el-scrollbar height="calc(100vh - 320px)">
      <div v-loading="loading" class="segment-preview-body">
        <template v-if="visibleSegments.length">
          <div
            v-for="(item, index) in visibleSegments"
            :key="item.id"
            :ref="(el: any) => setSegmentRef(item.id, el)"
            class="segment-preview-item"
          >
            <el-card
              shadow="never"
              class="segment-preview-card"
              :class="{
                'is-hit': isHit(item),
                'is-disabled': item.is_active === false
              }"
            >
              <div class="segment-preview-card-header">
                <div class="segment-preview-card-title flex align-center">
                  <AppAvatar class="mr-8 avatar-light" :size="22">{{ index + 1 }}</AppAvatar>
                  <span class="ellipsis-1" :title="segmentTitle(item)">
                    {{ segmentTitle(item) }}
                  </span>
                  <el-tag v-if="isHit(item)" class="ml-8" size="small" effect="dark">
                    {{ $t('chat.segmentPreview.hit') }}
                  </el-tag>
                  <el-tag
                    v-if="item.is_active === false"
                    class="ml-8"
                    size="small"
                    type="info"
                    effect="plain"
                  >
                    {{ $t('chat.segmentPreview.disabled') }}
                  </el-tag>
                </div>
                <span class="segment-preview-length color-secondary">
                  {{ (item.content || '').length }} {{ $t('chat.segmentPreview.chars') }}
                </span>
              </div>
              <div class="segment-preview-content">
                <MdPreview editorId="preview-only" :modelValue="item.content" noImgZoomIn />
              </div>
            </el-card>
          </div>
          <div v-if="hasMore" class="segment-preview-more">
            <el-button text type="primary" @click="renderLimit += RENDER_STEP">
              {{ $t('chat.segmentPreview.loadMore') }}
            </el-button>
          </div>
        </template>
        <el-empty v-else-if="!loading" :description="$t('chat.segmentPreview.empty')" />
      </div>
    </el-scrollbar>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { getImgUrl } from '@/utils/utils'
import { openDocumentPreviewTab } from '@/utils/document'
import applicationApi from '@/api/application'
import { t } from '@/locales'

const emit = defineEmits(['previewed'])

/** 单次渲染的分段数，逐批渲染避免几百个分段一次性渲染卡住界面。 */
const RENDER_STEP = 50

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<any>({})
const renderLimit = ref(RENDER_STEP)
// 打开全文预览需要应用 id 做鉴权，打开分段预览时先记住。
let currentApplicationId = ''
// 分段元素按 id 暂存，加载完成后把命中分段滚动到可视区域。
const segmentRefs = new Map<string, any>()

const visibleSegments = computed(() => (detail.value.paragraphs || []).slice(0, renderLimit.value))
const hasMore = computed(() => (detail.value.paragraphs?.length || 0) > renderLimit.value)

const setSegmentRef = (id: string, el: any) => {
  if (el) {
    segmentRefs.set(id + '', el)
  }
}

const isHit = (item: any) => {
  return item?.id !== undefined && item.id + '' === detail.value.hit_paragraph_id + ''
}

const segmentTitle = (item: any) => {
  const title = item?.title?.trim()
  return title ? title : t('chat.segmentPreview.untitled')
}

const open = (applicationId: string, documentId: string, paragraphId?: string) => {
  segmentRefs.clear()
  renderLimit.value = RENDER_STEP
  currentApplicationId = applicationId
  detail.value = { hit_paragraph_id: paragraphId }
  dialogVisible.value = true
  loading.value = true
  applicationApi
    .getSegmentPreview(applicationId, documentId, paragraphId)
    .then((res: any) => {
      detail.value = res.data || {}
      expandToHitSegment()
      scrollToHitSegment()
      emit('previewed', detail.value)
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false
    })
}

/** 命中分段排在本批渲染范围之外时先把它扩进来，否则滚不过去。 */
function expandToHitSegment() {
  const paragraphs = detail.value.paragraphs || []
  const hitIndex = paragraphs.findIndex((item: any) => isHit(item))
  if (hitIndex + 1 > renderLimit.value) {
    renderLimit.value = hitIndex + 1
  }
}

function scrollToHitSegment() {
  nextTick(() => {
    const hitId = detail.value.hit_paragraph_id
    if (!hitId) {
      return
    }
    const target = segmentRefs.get(hitId + '')
    if (target) {
      // 命中分段可能很长，对齐到分段开头更便于核对引用内容。
      target.scrollIntoView({ block: 'start' })
    }
  })
}

/** 点击文档名称或「预览全文」按钮，在新标签页打开文档预览页。 */
function openDocumentPreview() {
  if (!currentApplicationId || !detail.value.document_id) {
    return
  }
  openDocumentPreviewTab(currentApplicationId, detail.value.document_id)
}

defineExpose({ open })
</script>
<style lang="scss" scoped>
.segment-preview-header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 500;
}

.segment-preview-name {
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}

.segment-preview-body {
  padding: 0 8px;
}

.segment-preview-card {
  border-radius: 8px;

  &.is-hit {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &.is-disabled {
    opacity: 0.65;
  }
}

.segment-preview-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.segment-preview-card-title {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}

.segment-preview-length {
  flex: none;
  margin-left: 12px;
  font-size: 12px;
}

.segment-preview-content {
  padding-top: 8px;
  overflow: hidden;
}

.segment-preview-more {
  padding: 8px 0 16px 0;
  text-align: center;
}
</style>
