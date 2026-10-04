<template>
  <div class="w-full">
    <el-select v-model="modelValue" popper-class="select-model" :clearable="true" v-bind="$attrs">
      <el-option-group
        v-for="(value, label) in options"
        :key="value"
        :label="relatedObject(providerOptions, label, 'provider')?.name"
      >
        <el-option
          v-for="item in value.filter((v: any) => v.status === 'SUCCESS')"
          :key="item.id"
          :label="item.name"
          :value="item.id"
          class="flex-between"
        >
          <div class="flex">
            <span
              v-html="relatedObject(providerOptions, label, 'provider')?.icon"
              class="model-icon mr-8"
            ></span>
            <span>{{ item.name }}</span>
            <el-tag v-if="item.permission_type === 'PUBLIC'" type="info" class="info-tag ml-8 mt-4">
              {{ $t('common.public') }}
            </el-tag>
          </div>
          <el-icon class="check-icon" v-if="item.id === modelValue">
            <Check />
          </el-icon>
        </el-option>
        <!-- 不可用 -->
        <el-option
          v-for="item in value.filter((v: any) => v.status !== 'SUCCESS')"
          :key="item.id"
          :label="item.name"
          :value="item.id"
          class="flex-between"
          disabled
        >
          <div class="flex">
            <span
              v-html="relatedObject(providerOptions, label, 'provider')?.icon"
              class="model-icon mr-8"
            ></span>
            <span>{{ item.name }}</span>
            <span class="danger">{{ $t('common.unavailable') }}</span>
          </div>
          <el-icon class="check-icon" v-if="item.id === modelValue">
            <Check />
          </el-icon>
        </el-option>
      </el-option-group>
      <template #footer v-if="showFooter">
        <slot name="footer">
          <div class="w-full text-left cursor" @click="openCreateModel(undefined, props.modelType)">
            <el-button type="primary" link>
              <el-icon class="mr-4">
                <Plus />
              </el-icon>
              {{ $t('views.application.applicationForm.buttons.addModel') }}
            </el-button>
          </div>
        </slot>
      </template>
    </el-select>
    <!-- 添加模版 -->
    <CreateModelDialog
      v-if="showFooter"
      ref="createModelRef"
      @submit="submitModel"
      @change="openCreateModel($event)"
    ></CreateModelDialog>
    <SelectProviderDialog
      v-if="showFooter"
      ref="selectProviderRef"
      @change="(provider, modelType) => openCreateModel(provider, modelType)"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { Provider } from '@/api/type/model'
import { relatedObject } from '@/utils/utils'
import CreateModelDialog from '@/views/template/component/CreateModelDialog.vue'
import SelectProviderDialog from '@/views/template/component/SelectProviderDialog.vue'

import { t } from '@/locales'
import useStore from '@/stores'

defineOptions({ name: 'ModelSelect' })
const props = defineProps<{
  modelValue: any
  options: any
  showFooter?: false
  modelType?: ''
}>()

const emit = defineEmits(['update:modelValue', 'change', 'submitModel'])
const modelValue = computed({
  set: (item) => {
    emit('change', item)
    emit('update:modelValue', item)
  },
  get: () => {
    return props.modelValue
  }
})
const { model } = useStore()

const createModelRef = ref<InstanceType<typeof CreateModelDialog>>()
const selectProviderRef = ref<InstanceType<typeof SelectProviderDialog>>()
const providerOptions = ref<Array<Provider>>([])
const loading = ref(false)

function getProvider() {
  loading.value = true
  model
    .asyncGetProvider()
    .then((res: any) => {
      providerOptions.value = res?.data
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })
}

const openCreateModel = (provider?: Provider, model_type?: string) => {
  if (provider && provider.provider) {
    createModelRef.value?.open(provider, model_type)
  } else {
    selectProviderRef.value?.open(model_type)
  }
}

function submitModel() {
  emit('submitModel')
}

onMounted(() => {
  getProvider()
})
</script>
<style lang="scss" scoped>
// AI模型选择：添加模型hover样式
.select-model {
  .el-select-dropdown__footer {
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  // 平台图标：供应商 SVG 自带 width/height，必须同时锁死容器与内部尺寸，
  // 否则图标会按自身 intrinsic 尺寸撑破行高并与模型名重叠。
  .model-icon {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
    // 选项行是 align-items:center 的 flex 容器。子项默认 align-self:auto，会先按
    // stretch 解析并被顶到行首；必须显式 align-self:center，图标才和文字同一水平线。
    display: inline-flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    // v-html 注入的 SVG 不会被加上 scoped 属性，必须用 :deep 才选得中。
    // 同时用 !important 压掉 SVG 自身的 width/height 属性，避免内部尺寸把容器撑大。
    :deep(svg) {
      width: 18px !important;
      height: 18px !important;
      display: block;
    }
  }

  .check-icon {
    position: absolute;
    right: 10px;
  }
}
</style>
