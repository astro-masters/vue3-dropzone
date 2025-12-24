export type DropzoneMode = 'drop' | 'preview' | 'edit'

export type DropzoneState = 'error' | 'success' | 'indeterminate'

export type DropzoneSelectFileStrategy = 'replace' | 'merge'

export type DropzonePreviewPosition = 'inside' | 'outside'

export type DropzoneItemType = 'file' | 'url'

export type DropzoneStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface DropzoneBaseItem {
  id: string | number
  src: string
  file?: File
  progress: number
  status: DropzoneStatus
  message: string | null
  name: string
  size: number
  type: DropzoneItemType
  isPreview: boolean
}

export interface DropzoneFileItem extends DropzoneBaseItem {
  type: 'file'
  file: File
}

export interface DropzoneUrlItem extends DropzoneBaseItem {
  type: 'url'
}

export type DropzoneItem = DropzoneFileItem | DropzoneUrlItem

export type DropzoneErrorType =
  | 'file-too-large'
  | 'invalid-file-format'
  | 'upload-error'
  | 'delete-error'

export interface DropzoneErrorEvent {
  type: DropzoneErrorType | (string & {})
  files: unknown[]
}
