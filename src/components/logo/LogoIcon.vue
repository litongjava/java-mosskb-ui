<template>
  <svg
    v-if="!isDefaultTheme"
    :class="!isDefaultTheme ? 'custom-logo-color' : ''"
    :height="height"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 232 232"
    fill="none"
  >
    <title>MossKB</title>
    <path d="M116 48C113 29 126 17 151 18C151 39 138 51 116 48Z" fill="currentColor" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M69 53C47.46 53 30 70.46 30 92V135C30 156.54 47.46 174 69 174H79V190C79 195.04 84.67 198.01 88.82 195.14L119.39 174H163C184.54 174 202 156.54 202 135V92C202 70.46 184.54 53 163 53H69ZM69 76C60.16 76 53 83.16 53 92V135C53 143.84 60.16 151 69 151H89C95.08 151 100 155.92 100 162V163.5L115.37 152.87C117.13 151.65 119.22 151 121.36 151H163C171.84 151 179 143.84 179 135V92C179 83.16 171.84 76 163 76H69Z"
      fill="currentColor"
    />
    <path
      d="M22 94H19C15.69 94 13 96.69 13 100V127C13 130.31 15.69 133 19 133H22V94ZM210 94H213C216.31 94 219 96.69 219 100V127C219 130.31 216.31 133 213 133H210V94Z"
      fill="currentColor"
    />
    <path
      d="M78 128V99L116 121L154 99V128"
      stroke="currentColor"
      stroke-width="13"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
  <img v-else src="@/assets/logo/logo.svg" :height="height" />
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import useStore from '@/stores'
defineOptions({ name: 'LogoIcon' })

defineProps({
  height: {
    type: String,
    default: '36px'
  }
})
const { user } = useStore()
const isDefaultTheme = computed(() => {
  return user.isDefaultTheme()
})
</script>
<style lang="scss" scoped>
.custom-logo-color {
  color: var(--el-color-primary);
}
</style>
