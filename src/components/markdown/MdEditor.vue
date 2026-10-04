<template>
  <MdEditor :language="language" noIconfont noPrettier v-bind="forwardedAttrs()">
    <template #defFooters>
      <slot name="defFooters"> </slot>
    </template>
  </MdEditor>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
const componentAttrs = useAttrs()
const forwardedAttrs = (): Record<string, unknown> => ({ ...componentAttrs })
import { computed } from 'vue'
import { MdEditor, config } from 'md-editor-v3'
import { getBrowserLang } from '@/locales/index'
import './assets/markdown-iconfont.js'
// 引入公共库中的语言配置
import ZH_TW from '@vavt/cm-extension/dist/locale/zh-TW'

defineOptions({ name: 'MdEditor' })
const language = computed(() => localStorage.getItem('MossKB-locale') || getBrowserLang() || '')
config({
  editorConfig: {
    languageUserDefined: {
      'zh-Hant': ZH_TW
    }
  }
})
</script>
