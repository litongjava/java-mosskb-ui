import router from '@/router'

/**
 * 在新标签页打开文档预览页。
 *
 * 预览接口不需要登录，链接本身就是访问凭据，所以地址里只带应用与文档 ID：
 * 分享链接的访客和已登录用户打开的是同一个地址，登录与否结果一致。
 */
export function openDocumentPreviewTab(applicationId: string, documentId: string) {
  if (!applicationId || !documentId) {
    return
  }
  const path = `#/document-preview/${applicationId}/${documentId}`
  try {
    const { href } = router.resolve({
      name: 'DocumentPreview',
      params: { applicationId, documentId }
    })
    window.open(new URL(href, window.location.href).href, '_blank')
  } catch (e) {
    // 路由还没注册好时退回按路径拼地址，保证调用方（分段预览、知识库引用）不受影响
    window.open(new URL(path, window.location.href).href, '_blank')
  }
}
