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
					<PlaceholderImage />
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
				<template #remove-button="slotProps">
					<slot name="remove-button" v-bind="slotProps"></slot>
				</template>
				<template #progress="slotProps">
					<slot name="progress" v-bind="slotProps"></slot>
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
				<template #remove-button="slotProps">
					<slot name="remove-button" v-bind="slotProps"></slot>
				</template>
				<template #progress="slotProps">
					<slot name="progress" v-bind="slotProps"></slot>
				</template>
			</PreviewSlot>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, getCurrentInstance, ref, watchEffect, type PropType } from 'vue'
	import type {
		DropzoneErrorEvent,
		DropzoneFileItem,
		DropzoneItem,
		DropzoneMode,
		DropzonePreviewPosition,
		DropzoneSelectFileStrategy,
		DropzoneState,
		DropzoneRemoveRequestEvent,
		DropzoneUploadRequestEvent,
	} from '../types'
	import { generateFileId } from '../utils/generateFileId'
	import { processIncomingFiles as processIncomingFilesUseCase } from '../usecases/processIncomingFiles'
	import { removeDropzoneItem } from '../usecases/removeDropzoneItem'
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
				if (url) {
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
		(e: 'upload-request', payload: DropzoneUploadRequestEvent): void
		(e: 'remove-request', payload: DropzoneRemoveRequestEvent): void
		(e: 'fileUploaded', payload: { file: DropzoneFileItem }): void
		(e: 'fileRemoved', payload: DropzoneItem): void
		(e: 'previewRemoved', payload: DropzoneItem): void
	}>()

	const fileInput = ref<HTMLInputElement | null>(null)
	const files = ref<DropzoneFileItem[]>([])
	const active = ref(false)
	const dropzoneWrapper = ref<HTMLElement | null>(null)
	const previewsReplaced = ref(false) // Отмечаем, что исходные предпросмотры были заменены
	const instance = getCurrentInstance()

	const hasListener = (listenerPropName: string): boolean => {
		const vnodeProps = (instance?.vnode?.props ?? {}) as Record<string, unknown>
		const candidate = vnodeProps[listenerPropName]
		return typeof candidate === 'function' || (Array.isArray(candidate) && candidate.length > 0)
	}
	const fileInputId = computed<string>(() => {
		if (props.fileInputId) return props.fileInputId
		return String(generateFileId())
	})

	const fileInputAllowed = computed(() => {
		return !props.disabled && (props.mode === 'drop' || (props.mode === 'preview' && props.allowSelectOnPreview) || props.mode === 'edit')
	})

	const processIncomingFiles = (incomingFiles: FileList | File[]): void => {
		const result = processIncomingFilesUseCase({
			incomingFiles,
			currentFiles: files.value,
			maxFiles: props.maxFiles,
			maxFileSize: props.maxFileSize,
			accept: props.accept,
			mode: props.mode,
			allowSelectOnPreview: props.allowSelectOnPreview,
			selectFileStrategy: props.selectFileStrategy,
			generateFileId,
			previewsReplaced: previewsReplaced.value,
		})

		if (result.errors.length) {
			result.errors.forEach((error) => handleFileError(error.type, error.files))
		}

		files.value = result.nextFiles
		previewsReplaced.value = result.nextPreviewsReplaced

		if (result.shouldClearPreviews) {
			emit('update:previews', [])
		}

		result.uploadCandidates.forEach((fileItem) => {
			// Загружаем файлы на сервер (только не для preview режима)
			if (props.serverSide && props.mode !== 'preview') {
				uploadFileToServer(fileItem)
			} else if (props.mode !== 'preview') {
				fileItem.progress = 100
				fileItem.status = 'success'
				fileItem.message = 'Файл успешно загружен'
				emit('fileUploaded', { file: fileItem })
			}
		})
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
		const endpoint = props.uploadEndpoint || ''

		if (hasListener('onUploadRequest')) {
			const formData = new FormData();
			formData.append('file', fileItem.file)

			fileItem.status = 'uploading'
			fileItem.message = 'Идёт загрузка'

			let settled = false
			const progress = (percent: number) => {
				fileItem.progress = Math.max(0, Math.min(100, Math.round(percent)))
			}
			const success = () => {
				if (settled) return
				settled = true
				fileItem.progress = 100
				fileItem.status = 'success'
				fileItem.message = 'Файл успешно загружен'
				emit('fileUploaded', { file: fileItem })
			}
			const error = (message?: string) => {
				if (settled) return
				settled = true
				fileItem.status = 'error'
				fileItem.message = message ?? 'Загрузка не удалась'
				handleFileError('upload-error', [fileItem.file])
			}

			emit('upload-request', {
				fileItem,
				endpoint,
				headers: props.headers,
				formData,
				progress,
				success,
				error,
			})
			return
		}

		const xhr = new XMLHttpRequest();
		xhr.open('POST', endpoint, true)

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
		const result = removeDropzoneItem({
			item,
			previews: props.previews || [],
			currentFiles: files.value,
			serverSide: props.serverSide,
			deleteEndpoint: props.deleteEndpoint,
		})

		if (result.removedPreviewIndex !== null) {
			emit('update:previews', result.nextPreviews)
			emit('previewRemoved', item)
			return
		}

		if (result.shouldDeleteFromServer) {
			removeFileFromServer(item)
			return
		}

		files.value = result.nextFiles as DropzoneFileItem[]

		if (fileInput.value) {
			fileInput.value.value = ''
		}

		emit('fileRemoved', item)
		emit('update:modelValue', files.value)
	};

	const removeFileFromServer = (item: DropzoneItem): void => {
		const endpoint = props.deleteEndpoint ? `${props.deleteEndpoint}/${item.id}` : ''

		if (hasListener('onRemoveRequest')) {
			let settled = false
			const success = () => {
				if (settled) return
				settled = true
				removeFileFromList(item)
			}
			const error = (message?: string) => {
				if (settled) return
				settled = true
				item.status = 'error'
				item.message = message ?? 'Удаление не удалось'
				handleFileError('delete-error', [item])
			}

			emit('remove-request', {
				item,
				endpoint,
				headers: props.headers,
				success,
				error,
			})
			return
		}

		const xhr = new XMLHttpRequest();
		xhr.open('DELETE', endpoint, true)

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
		if (!props.ignoreOriginalPreviews && (!files.value || !Array.isArray(files.value) || files.value.length === 0)) {
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
		--v3-dropzone--primary: 69, 90, 100;
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
