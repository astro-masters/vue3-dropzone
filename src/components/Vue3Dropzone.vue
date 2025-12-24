<template>
  <div class="dropzone">
    <div
        class="dropzone-wrapper"
        :style="{ width, height }"
        @dragenter.prevent="toggleActive"
        @dragleave.prevent="toggleActive"
        @drop.prevent="drop"
        @dragover.prevent
        @mouseover="hover"
        @mouseleave="blurDrop"
        :class="[
          {
            'dropzone-wrapper--active': active,
            'dropzone-wrapper--disabled': disabled,
          },
          state ? `dropzone-wrapper--${state}` : '',
        ]"
        ref="dropzoneWrapper"
        @click="openSelectFile"
        id="dropzoneWrapper"
    >
      <!-- Input (выбор файла) -->
      <input
          type="file"
          ref="fileInput"
          class="hidden"
          :id="fileInputId"
          :accept="accept"
          @change="inputFiles"
          :multiple="multiple"
      />

      <!-- Контент-заглушка -->
      <template v-if="!unifiedItems.length || previewPosition === 'outside'">
        <slot name="placeholder-img">
          <PlaceholderImage/>
        </slot>
        <slot name="title">
          <div class="titles">
            <h1 class="m-0">Перетащите файлы сюда</h1>
          </div>
        </slot>
        <slot name="button" :fileInput="fileInput">
          <button
              type="button"
              v-if="showSelectButton"
              class="select-file"
          >
            Выбрать файл
          </button>
        </slot>
        <slot name="description">
          <p class="m-0 description">
            Файлы должны быть не больше {{ maxFileSize }}MB
            {{ accept ? `и в форматах ${accept}` : "" }}
          </p>
        </slot>
      </template>

      <!-- Предпросмотр файлов внутри -->
      <PreviewSlot
          v-if="previewPosition === 'inside' && unifiedItems.length"
          v-bind="previewProps"
          @removeFile="removeFile"
          @click="fileInputAllowed && openSelectFile($event)"
          @mouseover="fileInputAllowed ? hover : undefined"
          @mouseleave="fileInputAllowed ? blurDrop : undefined"
      >
        <template #preview="previewProps">
          <slot name="preview" v-bind="previewProps"></slot>
        </template>
      </PreviewSlot>
    </div>
    <div
        class="dropzone-wrapper__disabled"
        @click.prevent
        @drop.prevent
        @dragover.prevent
        v-if="disabled"
    ></div>
    <!-- Предпросмотр файлов снаружи -->
    <div class="mt-5"
         v-if="previewPosition === 'outside' && unifiedItems.length">
      <PreviewSlot
          v-bind="previewProps"
          @removeFile="removeFile"
          @mouseover="fileInputAllowed ? hover : undefined"
          @mouseleave="fileInputAllowed ? blurDrop : undefined"
      >
        <template #preview="previewProps">
          <slot name="preview" v-bind="previewProps"></slot>
        </template>
      </PreviewSlot>
    </div>
  </div>
</template>

<script setup lang="ts">
 import { computed, ref, watchEffect, type PropType } from 'vue'
 import type {
   DropzoneErrorEvent,
   DropzoneFileItem,
   DropzoneItem,
   DropzoneMode,
   DropzonePreviewPosition,
   DropzoneSelectFileStrategy,
   DropzoneState,
 } from '../types'
 import PlaceholderImage from './PlaceholderImage.vue'
 import PreviewSlot from './PreviewSlot.vue'

 type FileInputLikeEvent = {
   target: {
     files: FileList | File[]
   }
 }

 const props = defineProps({
   modelValue: {
     type: Array as PropType<DropzoneFileItem[]>,
     default: () => [],
   },
   multiple: {
     type: Boolean,
     default: false,
   },
   previews: {
     type: Array as PropType<string[]>,
     default: () => [],
   },
   mode: {
     type: String as PropType<DropzoneMode>,
     default: 'drop',
     validator(value: string) {
       return ['drop', 'preview', 'edit'].includes(value)
     },
   },
   disabled: {
     type: Boolean,
     default: false,
   },
   state: {
     type: String as PropType<DropzoneState>,
     validator(value: string) {
       return ['error', 'success', 'indeterminate'].includes(value)
     },
     default: 'indeterminate',
   },
   accept: {
     type: String,
   },
   maxFileSize: {
     type: Number,
     default: 5,
   },
   maxFiles: {
     type: Number,
     default: 5,
   },
   width: {
     type: [Number, String] as PropType<number | string | undefined>,
   },
   height: {
     type: [Number, String] as PropType<number | string | undefined>,
   },
   imgWidth: {
     type: [Number, String] as PropType<number | string | undefined>,
   },
   imgHeight: {
     type: [Number, String] as PropType<number | string | undefined>,
   },
   fileInputId: {
     type: String,
   },
   previewWrapperClasses: {
     type: String,
     default: '',
   },
   previewPosition: {
     type: String as PropType<DropzonePreviewPosition>,
     default: 'inside',
     validator: (value: string) => ['inside', 'outside'].includes(value),
   },
   showSelectButton: {
     type: Boolean,
     default: true,
   },
   selectFileStrategy: {
     type: String as PropType<DropzoneSelectFileStrategy>,
     default: 'replace',
     validator: (value: string) => ['replace', 'merge'].includes(value),
   },
   serverSide: {
     type: Boolean,
     default: false,
   },
   uploadEndpoint: {
     type: String,
   },
   deleteEndpoint: {
     type: String,
   },
   headers: {
     type: Object as PropType<Record<string, string>>,
     default: () => ({}),
   },
   allowSelectOnPreview: {
     type: Boolean,
     default: false,
   },
   ignoreOriginalPreviews: {
     type: Boolean,
     default: false,
   },
 })

// Единая структура данных, объединяющая и объекты File, и URL-предпросмотры
 const unifiedItems = computed<DropzoneItem[]>(() => {
  const items: DropzoneItem[] = []

  // Сначала добавляем URL предпросмотра (существующие изображения)
  const hasPreviewModeFiles = props.mode === "preview" && props.allowSelectOnPreview && files.value && files.value.length > 0;

  // Показывать исходные предпросмотры если:
  // 1. Используется стратегия merge (всегда показываем исходные)
  // 2. Используется replace, но ignoreOriginalPreviews выключен и новые файлы не выбраны
  // 3. Мы не в preview режиме или файлы не выбраны
  const shouldShowOriginalPreviews = props.selectFileStrategy === "merge" ||
      (props.selectFileStrategy === "replace" && !hasPreviewModeFiles && (!previewsReplaced.value || !props.ignoreOriginalPreviews)) ||
      (props.mode !== "preview" || !props.allowSelectOnPreview);

  if (props.previews && Array.isArray(props.previews) && props.previews.length > 0 && shouldShowOriginalPreviews) {
    props.previews.forEach((url, index) => {
      if (url && typeof url === 'string') {
        items.push({
          id: `preview-${index}`,
          src: url,
          type: 'url',
          isPreview: true,
          name: `Изображение ${index + 1}`,
          size: 0, // Для URL предпросмотров нет информации о размере
          progress: 100,
          status: 'success',
          message: null
        });
      }
    });
  }

  // Добавляем реальные File объекты
  if (files.value && Array.isArray(files.value) && files.value.length > 0) {
    files.value.forEach(fileItem => {
      if (fileItem && typeof fileItem === 'object') {
        items.push({
          ...(fileItem as DropzoneFileItem),
          type: (fileItem as DropzoneFileItem).type,
          isPreview: Boolean((fileItem as DropzoneFileItem).isPreview),
        });
      }
    });
  }

  return items;
});

 const previewProps = computed(() => ({
  files: unifiedItems.value,
  previewUrls: [], // Устаревший prop, больше не используется
  multiple: props.multiple,
  mode: props.mode,
  allowSelectOnPreview: props.mode !== "preview" || props.allowSelectOnPreview,
  imgWidth: props.imgWidth,
  imgHeight: props.imgHeight,
  previewWrapperClasses: props.previewWrapperClasses,
  removeFileBuiltIn: removeFile
}));

 const emit = defineEmits<{
   (e: 'drop', event: DragEvent): void
   (e: 'update:modelValue', value: DropzoneFileItem[]): void
   (e: 'update:previews', value: string[]): void
   (e: 'error', payload: DropzoneErrorEvent): void
   (e: 'fileUploaded', payload: { file: DropzoneFileItem }): void
   (e: 'fileRemoved', payload: DropzoneItem): void
   (e: 'previewRemoved', payload: DropzoneItem): void
 }>()

 const fileInput = ref<HTMLInputElement | null>(null)
 const files = ref<DropzoneFileItem[]>([])
 const active = ref(false)
 const dropzoneWrapper = ref<HTMLElement | null>(null)
 const previewsReplaced = ref(false) // Отмечаем, что исходные предпросмотры были заменены
 const fileInputId = computed<string>(() => {
   if (props.fileInputId) return props.fileInputId
   return String(generateFileId())
 })

 const fileInputAllowed = computed(() => {
  return !props.disabled && (props.mode === 'drop' || (props.mode === 'preview' && props.allowSelectOnPreview) || props.mode === 'edit')
 })

 const generateFileId = (): number => {
  return Math.floor(Math.random() * Math.floor(Math.random() * Date.now()))
 }

 const processIncomingFiles = (incomingFiles: FileList | File[]): void => {
  const allFiles = Array.from(incomingFiles).slice(0, props.maxFiles)
  const filesSizesAreValid = allFiles.map((item) => {
    const itemSize = Number((item.size / 1024 / 1024).toFixed(2))
    return itemSize <= props.maxFileSize
  })
  const filesTypesAreValid = allFiles.map((item) => {
    if (props.accept) {
      return props.accept.includes(item.type)
    }
    return true
  })

  if (
      (filesSizesAreValid.every((item) => item === true) &&
          props.accept &&
          filesTypesAreValid.every((item) => item === true)) ||
      !props.accept && filesSizesAreValid.every((item) => item === true)
  ) {
    const processFile = (file: File): DropzoneFileItem => ({
      file,
      id: generateFileId(),
      src: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
      message: null,
      name: file.name,
      size: file.size,
      type: 'file',
      isPreview: false,
    })

    // Используем selectFileStrategy для всех режимов
    const strategy = props.selectFileStrategy;

    // В preview режиме с allowSelectOnPreview работаем немного иначе
    if (props.mode === "preview" && props.allowSelectOnPreview) {
      // В preview режиме храним файлы с метаданными, но считаем их предпросмотрами
      const processPreviewFile = (file: File): DropzoneFileItem | null => {
        if (!file || !(file instanceof File)) {
          return null
        }
        return {
          file,
          id: generateFileId(),
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

      const processedFiles = allFiles.map(processPreviewFile).filter(Boolean) as DropzoneFileItem[]

      if (strategy === "replace") {
        files.value = processedFiles
        // При replace скрываем исходные URL предпросмотра (обрабатывается внутри)
        previewsReplaced.value = true;
      }
      if (strategy === "merge") {
        files.value = [...files.value, ...processedFiles]
        // При merge оставляем исходные URL предпросмотра
      }
    } else {
      // Обычный режим — добавляем в массив files
      if (strategy === "replace") {
        files.value = allFiles.map(processFile)
        // В edit режиме при replace также очищаем previews
        if (props.mode === "edit") {
          emit('update:previews', [])
        }
      }
      if (strategy === "merge") {
        files.value = [...files.value, ...allFiles.map(processFile)]
      }
    }
  }

  if (filesSizesAreValid.some((item) => item !== true)) {
    const largeFiles = allFiles.filter((item) => {
      const itemSize = Number((item.size / 1024 / 1024).toFixed(2))
      return itemSize > props.maxFileSize
    });
    handleFileError('file-too-large', largeFiles)
  }

  if (props.accept && filesTypesAreValid.some((item) => item !== true)) {
    const accept = props.accept
    const wrongTypeFiles = allFiles.filter(
        (item) => (accept ? !accept.includes(item.type) : false)
    );
    handleFileError('invalid-file-format', wrongTypeFiles)
  }

  files.value
      .filter((fileItem) => fileItem.status !== 'success' && !fileItem.isPreview)
      .forEach((fileItem) => {
        // Загружаем файлы на сервер (только не для preview режима)
        if (props.serverSide && props.mode !== "preview") {
          uploadFileToServer(fileItem)
        } else if (props.mode !== "preview") {
          fileItem.progress = 100
          fileItem.status = 'success'
          fileItem.message = 'Файл успешно загружен'
          emit('fileUploaded', { file: fileItem })
        }
      });
}

// Обработка файлов, выбранных через input
 const inputFiles = (e: Event): void => {
  const target = e.target as HTMLInputElement | null
  const incomingFiles = target?.files
  if (!incomingFiles) return
  processIncomingFiles(incomingFiles)
 }

// Загрузка файла на сервер
const uploadFileToServer = (fileItem: DropzoneFileItem): void => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', props.uploadEndpoint || '', true)

  // Заголовки
  Object.keys(props.headers).forEach((key) => {
    xhr.setRequestHeader(key, props.headers[key])
  })

  const formData = new FormData();
  formData.append('file', fileItem.file)

  // Старт загрузки
  xhr.upload.onloadstart = () => {
    fileItem.status = 'uploading'
    fileItem.message = 'Идёт загрузка'
  };

  // Прогресс загрузки
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      fileItem.progress = Math.round((event.loaded / event.total) * 100)
    }
  };

  // Успешная загрузка
  xhr.onload = () => {
    if (xhr.status === 200) {
      fileItem.status = 'success'
      fileItem.message = 'Файл успешно загружен'
      emit('fileUploaded', { file: fileItem })
    } else {
      fileItem.status = 'error'
      fileItem.message = xhr.statusText
      handleFileError('upload-error', [fileItem.file])
    }
  };

  // Ошибка загрузки
  xhr.onerror = () => {
    fileItem.status = 'error'
    fileItem.message = 'Загрузка не удалась'
    handleFileError('upload-error', [fileItem.file])
  };

  // Отправляем файл на сервер
  xhr.send(formData)
};

// Переключаем активное состояние (стили) для режима drag'n'drop
const toggleActive = (): void => {
  if (fileInputAllowed.value) {
    active.value = !active.value
  }
};

// Обработка drop файлов
const drop = (e: DragEvent): void => {
  toggleActive()
  if (fileInputAllowed.value) {
    emit('drop', e)
    processIncomingFiles(e.dataTransfer ? [...e.dataTransfer.files] : [])
  }
};

// Расширенный removeFile для обработки разных типов элементов
const removeFile = (item: DropzoneItem): void => {
  if (!item || !item.id) {
    return
  }

  if (item.type === 'url' && typeof item.id === 'string' && item.id.startsWith('preview-')) {
    // Удаляем из массива previews (исходные URL предпросмотры)
    const currentPreviews = [...(props.previews || [])]
    const previewIndex = parseInt(item.id.replace('preview-', ''), 10)
    if (!isNaN(previewIndex) && previewIndex >= 0 && previewIndex < currentPreviews.length) {
      currentPreviews.splice(previewIndex, 1)
      emit('update:previews', currentPreviews)
      emit('previewRemoved', item)
    }
  } else if (item.isPreview) {
    // Удаляем файлы preview-режима из массива files
    removeFileFromList(item)
  } else {
    // Обычное удаление файлов
    if (props.serverSide) {
      removeFileFromServer(item)
    } else {
      removeFileFromList(item)
    }
  }
};

const removeFileFromServer = (item: DropzoneItem): void => {
  const xhr = new XMLHttpRequest();
  xhr.open('DELETE', props.deleteEndpoint ? `${props.deleteEndpoint}/${item.id}` : '', true)

  // Заголовки
  Object.keys(props.headers).forEach((key) => {
    xhr.setRequestHeader(key, props.headers[key]);
  });

  xhr.onload = () => {
    if (xhr.status === 200) {
      removeFileFromList(item)
    } else {
      handleFileError('delete-error', [item])
    }
  };

  xhr.onerror = () => {
    handleFileError('delete-error', [item])
  };

  xhr.send()
};

const removeFileFromList = (item: DropzoneItem): void => {
  if (!item || !item.id) {
    return;
  }

  files.value = files.value.filter((file) => file && file.id !== item.id)

  if (fileInput.value) {
    fileInput.value.value = ''
  }

  emit('fileRemoved', item)
  emit('update:modelValue', files.value)
};

// Управление hover/blur
const hover = (): void => {
  if (fileInputAllowed.value) {
    active.value = true
  }
};
const blurDrop = (): void => {
  active.value = false
};

// Открываем системное окно выбора файла
const openSelectFile = (e: MouseEvent): void => {
  if (fileInputAllowed.value) {
    fileInput.value?.click()
  } else {
    e.preventDefault()
  }
};

// Обработка ошибок файлов
const handleFileError = (type: DropzoneErrorEvent['type'], files: unknown[]): void => {
  emit('error', { type, files })
};

watchEffect(() => {
  if (files.value && files.value.length) {
    emit('update:modelValue', files.value)
  }
});

// Сбрасываем previewsReplaced, когда ignoreOriginalPreviews выключен и файлы не выбраны
watchEffect(() => {
  if (props.ignoreOriginalPreviews === false && (!files.value || !Array.isArray(files.value) || files.value.length === 0)) {
    previewsReplaced.value = false;
  }
});

const clearPreview = () => {
  unifiedItems.value.forEach((item) => removeFile(item));
};

// Публичные методы для программного управления
const clearFiles = () => {
  files.value = []
  emit('update:modelValue', [])
};

const clearPreviews = () => {
  emit('update:previews', [])
};

const clearAll = () => {
  clearFiles();
  clearPreviews();
};

defineExpose({
  clearPreview,
  clearFiles,
  clearPreviews,
  clearAll,
});
</script>

<style scoped lang="scss">
* {
  font-family: sans-serif;
}

.m-0 {
  margin: 0;
}

.mt-5 {
  margin-top: 3rem;
}

.dropzone {
  --v3-dropzone--primary: 94, 112, 210;
  --v3-dropzone--border: 214, 216, 220;
  --v3-dropzone--description: 190, 191, 195;
  --v3-dropzone--overlay: 40, 44, 53;
  --v3-dropzone--overlay-opacity: 0.3;
  --v3-dropzone--error: 255, 76, 81;
  --v3-dropzone--success: 36, 179, 100;
  position: relative;
  display: flex;
  flex-direction: column;
}

.hidden {
  display: none;
}

.dropzone-wrapper {
  border: 2px dashed rgba(var(--v3-dropzone--border));
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: auto;
  height: 200px;
  transition: 0.3s all ease;
  justify-content: center;
}

.dropzone-wrapper--disabled {
  opacity: 0.5;
}

.dropzone-wrapper__disabled {
  position: absolute;
  top: -2px;
  inset-inline-start: -2px;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  border-radius: 12px;
  background: transparent;
  z-index: 2;
}

.dropzone-wrapper--active {
  border-color: rgba(var(--v3-dropzone--primary)) !important;
  background: rgba(var(--v3-dropzone--primary), 0.1) !important;
}

.dropzone-wrapper--error {
  border-color: rgba(var(--v3-dropzone--error)) !important;
}

.dropzone-wrapper--success {
  border-color: rgba(var(--v3-dropzone--success)) !important;
}

.select-file {
  background: rgba(var(--v3-dropzone--primary));
  border-radius: 10px;
  font-weight: 500;
  font-size: 12px;
  border: none;
  padding: 10px 20px;
  color: #fff;
  cursor: pointer;
  margin-bottom: 10px;
  margin-top: 10px;
}

.description {
  font-size: 12px;
  color: rgba(var(--v3-dropzone--description));
}

.titles {
  text-align: center;
}

.titles h1 {
  font-weight: 400;
  font-size: 20px;
}

.titles h3 {
  margin-top: 30px;
  font-weight: 400;
}
</style>
