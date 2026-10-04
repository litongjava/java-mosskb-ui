import { Result } from '@/request/Result'
import { get, post, del, put, exportExcel, exportFile } from '@/request/index'
import type { Ref } from 'vue'
import type { KeyValue } from '@/api/type/common'
import type { pageRequest } from '@/api/type/common'

const prefix = '/dataset'

/**
 * 分段预览（上传文档）
 *
 * 后端只负责保存文件并建解析任务，立即返回 { task_id_list }；分段结果由本方法内部轮询
 * /dataset/document/split/task/{taskId} 取得，调用方拿到的仍然是分段列表。
 *
 * @param 参数  file:file,limit:number,patterns:array,with_filter:boolean
 */
const postSplitDocument: (data: any) => Promise<Result<any>> = async (data) => {
  const started: any = await post(
    `${prefix}/document/split`,
    data,
    undefined,
    undefined,
    1000 * 60 * 10
  )
  const taskIdList: Array<string> = started?.data?.task_id_list || []
  if (!taskIdList.length) {
    return started
  }
  const lists = await Promise.all(taskIdList.map((taskId) => pollSplitTask(taskId)))
  return { ...started, data: lists.flat() } as Result<any>
}

/** 解析一份大文档要几分钟，所以按 2 秒间隔轮询任务状态，最多等待 60 分钟。 */
const pollSplitTask: (taskId: string) => Promise<Array<any>> = async (taskId) => {
  const deadline = Date.now() + 1000 * 60 * 60
  for (;;) {
    try {
      const res: any = await get(`${prefix}/document/split/task/${taskId}`, {}, undefined, {
        silent: true
      })
      if (Array.isArray(res?.data)) {
        return res.data
      }
    } catch (error: any) {
      // 后端返回的失败原因需要提示用户，但统一拦截器已经弹过一次，这里不再重复。
      throw new Error(error?.message || '文档解析失败')
    }
    if (Date.now() > deadline) {
      throw new Error('文档解析超时，请稍后在文档列表查看解析结果')
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

/**
 * 分段标识列表
 * @param loading 加载器
 * @returns 分段标识列表
 */
const listSplitPattern: (
  loading?: Ref<boolean>
) => Promise<Result<Array<KeyValue<string, string>>>> = (loading) => {
  return get(`${prefix}/document/split_pattern`, {}, loading)
}

/**
 * 文档分页列表
 * @param 参数  dataset_id,
 * page {
 "current_page": "string",
 "page_size": "string",
 }
 * param {
 "name": "string",
 }
 */

const getDocument: (
  dataset_id: string,
  page: pageRequest,
  param: any,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, page, param, loading) => {
  return get(
    `${prefix}/${dataset_id}/document/${page.current_page}/${page.page_size}`,
    param,
    loading
  )
}

const getAllDocument: (dataset_id: string, loading?: Ref<boolean>) => Promise<Result<any>> = (
  dataset_id,
  loading
) => {
  return get(`${prefix}/${dataset_id}/document`, undefined, loading)
}

/**
 * 创建批量文档
 * @param 参数
 * {
 "name": "string",
 "paragraphs": [
 {
 "content": "string",
 "title": "string",
 "problem_list": [
 {
 "id": "string",
 "content": "string"
 }
 ]
 }
 ]
 }
 */
const postDocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, data, loading) => {
  return post(`${prefix}/${dataset_id}/document/_bach`, data, {}, loading, 1000 * 60 * 5)
}

/**
 * 修改文档
 * @param 参数
 * dataset_id, document_id,
 * {
 "name": "string",
 "is_active": true,
 "meta": {}
 }
 */
const putDocument: (
  dataset_id: string,
  document_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, document_id, data: any, loading) => {
  return put(`${prefix}/${dataset_id}/document/${document_id}`, data, undefined, loading)
}

/**
 * 删除文档
 * @param 参数 dataset_id, document_id,
 */
const delDocument: (
  dataset_id: string,
  document_id: string,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, document_id, loading) => {
  return del(`${prefix}/${dataset_id}/document/${document_id}`, loading)
}
/**
 * 批量删除文档
 * @param 参数 dataset_id,
 */
const delMulDocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, loading) => {
  return del(`${prefix}/${dataset_id}/document/_bach`, undefined, { id_list: data }, loading)
}

const batchRefresh: (
  dataset_id: string,
  data: any,
  stateList: Array<string>,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, stateList, loading) => {
  return put(
    `${prefix}/${dataset_id}/document/batch_refresh`,
    { id_list: data, state_list: stateList },
    undefined,
    loading
  )
}
/**
 * 文档详情
 * @param 参数 dataset_id
 */
const getDocumentDetail: (dataset_id: string, document_id: string) => Promise<Result<any>> = (
  dataset_id,
  document_id
) => {
  return get(`${prefix}/${dataset_id}/document/${document_id}`)
}

/**
 * 刷新文档向量库
 * @param 参数
 * dataset_id, document_id,
 */
const putDocumentRefresh: (
  dataset_id: string,
  document_id: string,
  state_list: Array<string>,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, document_id, state_list, loading) => {
  return put(
    `${prefix}/${dataset_id}/document/${document_id}/refresh`,
    { state_list },
    undefined,
    loading
  )
}

/**
 * 同步web站点类型
 * @param 参数
 * dataset_id, document_id,
 */
const putDocumentSync: (
  dataset_id: string,
  document_id: string,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, document_id, loading) => {
  return put(`${prefix}/${dataset_id}/document/${document_id}/sync`, undefined, undefined, loading)
}
const putLarkDocumentSync: (
  dataset_id: string,
  document_id: string,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, document_id, loading) => {
  return put(
    `${prefix}/lark/${dataset_id}/document/${document_id}/sync`,
    undefined,
    undefined,
    loading
  )
}

/**
 * 批量同步文档
 * @param 参数 dataset_id,
 */
const delMulSyncDocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, loading) => {
  return put(`${prefix}/${dataset_id}/document/_bach`, { id_list: data }, undefined, loading)
}
const delMulLarkSyncDocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, loading) => {
  return put(`${prefix}/lark/${dataset_id}/_batch`, { id_list: data }, undefined, loading)
}

/**
 * 创建Web站点文档
 * @param 参数
 * {
 "source_url_list": [
 "string"
 ],
 "selector": "string"
 }
 }
 */
const postWebDocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, data, loading) => {
  return post(`${prefix}/${dataset_id}/document/web`, data, undefined, loading)
}

/**
 * 导入QA文档
 * @param 参数
 * file
 }
 */
const postQADocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, data, loading) => {
  return post(`${prefix}/${dataset_id}/document/qa`, data, undefined, loading)
}

/**
 * 导入表格
 * @param 参数
 * file
 */
const postTableDocument: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<any>> = (dataset_id, data, loading) => {
  return post(`${prefix}/${dataset_id}/document/table`, data, undefined, loading)
}

/**
 * 批量迁移文档
 * @param 参数 dataset_id,target_dataset_id,
 */
const putMigrateMulDocument: (
  dataset_id: string,
  target_dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, target_dataset_id, data, loading) => {
  return put(
    `${prefix}/${dataset_id}/document/migrate/${target_dataset_id}`,
    data,
    undefined,
    loading
  )
}

/**
 * 批量修改命中方式
 * @param dataset_id 知识库id
 * @param data       {id_list:[],hit_handling_method:'directly_return|optimization'}
 * @param loading
 * @returns
 */
const batchEditHitHandling: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, loading) => {
  return put(`${prefix}/${dataset_id}/document/batch_hit_handling`, data, undefined, loading)
}

/**
 * 获得QA模版
 * @param 参数 fileName,type,
 */
const exportQATemplate: (fileName: string, type: string, loading?: Ref<boolean>) => void = (
  fileName,
  type,
  loading
) => {
  return exportExcel(fileName, `${prefix}/document/template/export`, { type }, loading)
}

/**
 * 获得table模版
 * @param 参数 fileName,type,
 */
const exportTableTemplate: (fileName: string, type: string, loading?: Ref<boolean>) => void = (
  fileName,
  type,
  loading
) => {
  return exportExcel(fileName, `${prefix}/document/table_template/export`, { type }, loading)
}

/**
 * 导出文档
 * @param document_name 文档名称
 * @param dataset_id    数据集id
 * @param document_id   文档id
 * @param loading       加载器
 * @returns
 */
const exportDocument: (
  document_name: string,
  dataset_id: string,
  document_id: string,
  loading?: Ref<boolean>
) => Promise<any> = (document_name, dataset_id, document_id, loading) => {
  return exportExcel(
    document_name + '.xlsx',
    `${prefix}/${dataset_id}/document/${document_id}/export`,
    {},
    loading
  )
}
/**
 * 导出文档
 * @param document_name 文档名称
 * @param dataset_id    数据集id
 * @param document_id   文档id
 * @param loading       加载器
 * @returns
 */
const exportDocumentZip: (
  document_name: string,
  dataset_id: string,
  document_id: string,
  loading?: Ref<boolean>
) => Promise<any> = (document_name, dataset_id, document_id, loading) => {
  return exportFile(
    document_name + '.zip',
    `${prefix}/${dataset_id}/document/${document_id}/export_zip`,
    {},
    loading
  )
}
const batchGenerateRelated: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, loading) => {
  return put(`${prefix}/${dataset_id}/document/batch_generate_related`, data, undefined, loading)
}

const cancelTask: (
  dataset_id: string,
  document_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, document_id, data, loading) => {
  return put(
    `${prefix}/${dataset_id}/document/${document_id}/cancel_task`,
    data,
    undefined,
    loading
  )
}

const batchCancelTask: (
  dataset_id: string,
  data: any,
  loading?: Ref<boolean>
) => Promise<Result<boolean>> = (dataset_id, data, loading) => {
  return put(`${prefix}/${dataset_id}/document/cancel_task/_batch`, data, undefined, loading)
}

export default {
  postSplitDocument,
  getDocument,
  getAllDocument,
  postDocument,
  putDocument,
  delDocument,
  delMulDocument,
  getDocumentDetail,
  listSplitPattern,
  putDocumentRefresh,
  putDocumentSync,
  delMulSyncDocument,
  postWebDocument,
  putMigrateMulDocument,
  batchEditHitHandling,
  exportQATemplate,
  exportTableTemplate,
  postQADocument,
  postTableDocument,
  exportDocument,
  batchRefresh,
  batchGenerateRelated,
  cancelTask,
  exportDocumentZip,
  batchCancelTask,
  putLarkDocumentSync,
  delMulLarkSyncDocument
}
