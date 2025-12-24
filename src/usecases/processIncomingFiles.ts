import type {
    DropzoneErrorEvent,
    DropzoneFileItem,
    DropzoneMode,
    DropzoneSelectFileStrategy,
} from '../types'

export type ProcessIncomingFilesParams = {
    incomingFiles: FileList | File[]
    currentFiles: DropzoneFileItem[]
    maxFiles: number
    maxFileSize: number
    accept?: string
    mode: DropzoneMode
    allowSelectOnPreview: boolean
    selectFileStrategy: DropzoneSelectFileStrategy
    generateFileId: () => number
    previewsReplaced: boolean
}

export type ProcessIncomingFilesResult = {
    nextFiles: DropzoneFileItem[]
    nextPreviewsReplaced: boolean
    shouldClearPreviews: boolean
    errors: DropzoneErrorEvent[]
    uploadCandidates: DropzoneFileItem[]
}

export const processIncomingFiles = (
    params: ProcessIncomingFilesParams,
): ProcessIncomingFilesResult => {
    const allFiles = Array.from(params.incomingFiles).slice(0, params.maxFiles)

    const filesSizesAreValid = allFiles.map((item) => {
        const itemSize = Number((item.size / 1024 / 1024).toFixed(2))
        return itemSize <= params.maxFileSize
    })

    const filesTypesAreValid = allFiles.map((item) => {
        if (params.accept) {
            return params.accept.includes(item.type)
        }
        return true
    })

    const errors: DropzoneErrorEvent[] = []

    if (filesSizesAreValid.some((item) => !item)) {
        const largeFiles = allFiles.filter((item) => {
            const itemSize = Number((item.size / 1024 / 1024).toFixed(2))
            return itemSize > params.maxFileSize
        })

        errors.push({
            type: 'file-too-large',
            files: largeFiles,
        })
    }

    if (params.accept && filesTypesAreValid.some((item) => !item)) {
        const accept = params.accept
        const wrongTypeFiles = allFiles.filter((item) =>
            accept ? !accept.includes(item.type) : false,
        )

        errors.push({
            type: 'invalid-file-format',
            files: wrongTypeFiles,
        })
    }

    const isValidSelection =
        (filesSizesAreValid.every((item) => item) &&
            params.accept &&
            filesTypesAreValid.every((item) => item)) ||
        (!params.accept && filesSizesAreValid.every((item) => item))

    let nextFiles = params.currentFiles
    let nextPreviewsReplaced = params.previewsReplaced
    let shouldClearPreviews = false

    if (isValidSelection) {
        const processFile = (file: File): DropzoneFileItem => ({
            file,
            id: params.generateFileId(),
            src: URL.createObjectURL(file),
            progress: 0,
            status: 'pending',
            message: null,
            name: file.name,
            size: file.size,
            type: 'file',
            isPreview: false,
        })

        const strategy = params.selectFileStrategy

        if (params.mode === 'preview' && params.allowSelectOnPreview) {
            const processPreviewFile = (file: File): DropzoneFileItem | null => {
                if (!file || !(file instanceof File)) {
                    return null
                }

                return {
                    file,
                    id: params.generateFileId(),
                    src: URL.createObjectURL(file),
                    progress: 100,
                    status: 'success',
                    message: null,
                    name: file.name || 'Неизвестный файл',
                    size: file.size || 0,
                    type: 'file',
                    isPreview: true,
                }
            }

            const processedFiles = allFiles
                .map(processPreviewFile)
                .filter(Boolean) as DropzoneFileItem[]

            if (strategy === 'replace') {
                nextFiles = processedFiles
                nextPreviewsReplaced = true
            }

            if (strategy === 'merge') {
                nextFiles = [...params.currentFiles, ...processedFiles]
            }
        } else {
            if (strategy === 'replace') {
                nextFiles = allFiles.map(processFile)

                if (params.mode === 'edit') {
                    shouldClearPreviews = true
                }
            }

            if (strategy === 'merge') {
                nextFiles = [...params.currentFiles, ...allFiles.map(processFile)]
            }
        }
    }

    const uploadCandidates = nextFiles.filter(
        (fileItem) => fileItem.status !== 'success' && !fileItem.isPreview,
    )

    return {
        nextFiles,
        nextPreviewsReplaced,
        shouldClearPreviews,
        errors,
        uploadCandidates,
    }
}
