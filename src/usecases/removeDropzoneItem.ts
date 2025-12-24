import type { DropzoneItem } from '../types'

export type RemoveDropzoneItemParams = {
  item: DropzoneItem
  previews: string[]
  currentFiles: { id: string | number }[]
  serverSide: boolean
  deleteEndpoint?: string
}

export type RemoveDropzoneItemResult = {
  nextFiles: { id: string | number }[]
  nextPreviews: string[]
  removedPreviewIndex: number | null
  shouldDeleteFromServer: boolean
}

export const removeDropzoneItem = (
  params: RemoveDropzoneItemParams,
): RemoveDropzoneItemResult => {
  const { item } = params

  if (!item || item.id === undefined || item.id === null) {
    return {
      nextFiles: params.currentFiles,
      nextPreviews: params.previews,
      removedPreviewIndex: null,
      shouldDeleteFromServer: false,
    }
  }

  if (
    item.type === 'url' &&
    typeof item.id === 'string' &&
    item.id.startsWith('preview-')
  ) {
    const nextPreviews = [...(params.previews || [])]
    const previewIndex = parseInt(item.id.replace('preview-', ''), 10)

    if (
      !Number.isNaN(previewIndex) &&
      previewIndex >= 0 &&
      previewIndex < nextPreviews.length
    ) {
      nextPreviews.splice(previewIndex, 1)

      return {
        nextFiles: params.currentFiles,
        nextPreviews,
        removedPreviewIndex: previewIndex,
        shouldDeleteFromServer: false,
      }
    }

    return {
      nextFiles: params.currentFiles,
      nextPreviews: params.previews,
      removedPreviewIndex: null,
      shouldDeleteFromServer: false,
    }
  }

  const nextFiles = params.currentFiles.filter((file) => file.id !== item.id)

  if (item.isPreview) {
    return {
      nextFiles,
      nextPreviews: params.previews,
      removedPreviewIndex: null,
      shouldDeleteFromServer: false,
    }
  }

  return {
    nextFiles,
    nextPreviews: params.previews,
    removedPreviewIndex: null,
    shouldDeleteFromServer: Boolean(params.serverSide && params.deleteEndpoint),
  }
}
