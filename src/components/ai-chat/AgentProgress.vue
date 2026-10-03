<template>
  <div v-if="status || trace?.length || context?.compacted_rounds" class="agent-progress">
    <p v-if="!done && status" role="status">{{ progressText }}</p>
    <details v-if="trace?.length">
      <summary>检索过程 · {{ trace.length }} 轮 · {{ stopLabel }}</summary>
      <div v-for="step in trace" :key="step.round" class="round">
        <strong>第 {{ step.round }} 轮</strong>
        <p v-for="query in step.queries" :key="query">检索：{{ query }}</p>
        <p>新增 {{ step.new_paragraph_ids?.length || 0 }} 个片段；{{ step.sufficient ? '资料充分' : '仍有资料缺口' }}</p>
        <p v-if="step.missing">{{ step.missing }}</p>
      </div>
    </details>
    <small v-if="context?.compacted_rounds">上下文：已压缩 {{ context.compacted_rounds }} 轮，保留近期 {{ context.recent_rounds }} 轮原文</small>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ status?: any; trace?: any[]; context?: any; stop?: string; done?: boolean }>()
const labels: Record<string, string> = {
  sufficient: '资料充分', max_rounds: '达到检索轮次上限', no_new_evidence: '未发现新增资料',
  duplicate_query: '查询重复', evidence_budget: '达到资料容量上限', no_followup_query: '无后续查询',
  no_datasets: '未关联知识库', assessment_error: '资料核验未完成'
}
const stopLabel = computed(() => labels[props.stop || ''] || '已完成')
const progressText = computed(() => {
  if (props.status?.phase === 'context') {
    return '正在读取会话上下文…'
  }
  if (props.status?.phase === 'compacting') {
    return 'Compacting context · 上下文 token 超出预算，正在压缩…'
  }
  if (props.status?.phase === 'retrieving') {
    return `第 ${props.status.round} 轮检索：${props.status.query}`
  }
  if (props.status?.phase === 'assessed') {
    return props.status.sufficient ? '资料已充分，准备回答…' : `继续查找资料：${props.status.missing}`
  }
  return '正在根据检索资料生成回答…'
})
</script>
<style scoped>
.agent-progress { margin: 10px 0; font-size: 13px; color: var(--el-text-color-secondary); }
summary { cursor: pointer; }
.round { border-left: 2px solid var(--el-border-color); padding-left: 12px; margin: 12px 0; }
p { margin: 6px 0; overflow-wrap: anywhere; }
small { display: block; margin-top: 8px; }
</style>
