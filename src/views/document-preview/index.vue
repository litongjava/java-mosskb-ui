<template>
  <div class="document-preview-page">
    <DocumentPreview :application-id="applicationId" :document-id="documentId" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import DocumentPreview from '@/components/document-preview/index.vue'

const route = useRoute()

const applicationId = ref(String(route.params.applicationId || ''))
const documentId = ref(String(route.params.documentId || ''))
</script>
<style lang="scss" scoped>
.document-preview-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
