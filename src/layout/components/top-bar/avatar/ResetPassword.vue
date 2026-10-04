<template>
  <el-dialog
    v-model="resetPasswordDialog"
    :title="$t('views.login.resetPassword')"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      class="reset-password-form"
      ref="resetPasswordFormRef"
      :model="resetPasswordForm"
      :rules="rules"
    >
      <p class="mb-8 lighter">{{ $t('views.login.newPassword') }}</p>
      <el-form-item prop="password" style="margin-bottom: 8px">
        <el-input
          type="password"
          class="input-item"
          v-model="resetPasswordForm.password"
          :placeholder="$t('views.login.enterPassword')"
          show-password
        >
        </el-input>
      </el-form-item>
      <el-form-item prop="re_password">
        <el-input
          type="password"
          class="input-item"
          v-model="resetPasswordForm.re_password"
          :placeholder="$t('views.user.userForm.form.re_password.placeholder')"
          show-password
        >
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="resetPasswordDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="resetPassword">
          {{ $t('common.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { ResetCurrentUserPasswordRequest } from '@/api/type/user'
import type { FormInstance, FormRules } from 'element-plus'
import UserApi from '@/api/user'
import useStore from '@/stores'
import { useRouter } from 'vue-router'
import { t } from '@/locales'
const router = useRouter()
const { user } = useStore()

const resetPasswordDialog = ref<boolean>(false)

const resetPasswordForm = ref<ResetCurrentUserPasswordRequest>({
  password: '',
  re_password: ''
})

const resetPasswordFormRef = ref<FormInstance>()

const rules = ref<FormRules<ResetCurrentUserPasswordRequest>>({
  password: [
    {
      required: true,
      message: t('views.login.enterPassword'),
      trigger: 'blur'
    },
    {
      min: 6,
      max: 20,
      message: t('views.user.userForm.form.password.lengthMessage'),
      trigger: 'blur'
    }
  ],
  re_password: [
    {
      required: true,
      message: t('views.user.userForm.form.re_password.requiredMessage'),
      trigger: 'blur'
    },
    {
      min: 6,
      max: 20,
      message: t('views.user.userForm.form.password.lengthMessage'),
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        if (resetPasswordForm.value.password != resetPasswordForm.value.re_password) {
          callback(new Error(t('views.user.userForm.form.re_password.validatorMessage')))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const open = () => {
  resetPasswordForm.value = {
    password: '',
    re_password: ''
  }
  resetPasswordDialog.value = true
  resetPasswordFormRef.value?.resetFields()
}
/**
 * 修改当前登录用户的密码：身份由登录令牌确定，不再要求邮箱验证码。
 */
const resetPassword = () => {
  resetPasswordFormRef.value
    ?.validate()
    .then(() => {
      return UserApi.resetCurrentUserPassword(resetPasswordForm.value)
    })
    .then(() => {
      return user.logout()
    })
    .then(() => {
      router.push({ name: 'login' })
    })
}
const close = () => {
  resetPasswordDialog.value = false
}

defineExpose({ open, close })
</script>
<style lang="scss" scope></style>
