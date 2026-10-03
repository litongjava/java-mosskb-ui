<template>
  <MdPreview :language="language" noIconfont noPrettier :codeFoldable="false" v-bind="forwardedAttrs()" />
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
const componentAttrs = useAttrs()
const forwardedAttrs = (): Record<string, unknown> => ({ ...componentAttrs })
import { computed } from 'vue'
import { MdPreview, config } from 'md-editor-v3'
import { getBrowserLang } from '@/locales/index'
import useStore from '@/stores'
// 引入公共库中的语言配置
import ZH_TW from '@vavt/cm-extension/dist/locale/zh-TW'

defineOptions({ name: 'MdPreview' })
const { user } = useStore()
const language = computed(() => user.getLanguage() || getBrowserLang() || '')
config({
  editorConfig: {
    languageUserDefined: {
      'zh-Hant': ZH_TW
    }
  }
})
</script>
