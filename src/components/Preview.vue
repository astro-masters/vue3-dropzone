<template>
	<div
		class="preview-container"
		:class="previewWrapperClasses"
		@click="$emit('click', $event)"
	>
		<slot
			name="preview"
			v-for="item in files"
			:key="item.id"
			:data="item"
			:formatSize="formatSize"
			:removeFile="removeFileBuiltIn"
		>
			<div
				class="preview"
				:class="{
          preview__multiple: multiple,
          preview__file: item.type === 'file' && item.file && item.file.type && !item.file.type.includes('image/'),
        }"
				:style="{
          width: `${imgWidth} !important`,
          height: `${imgHeight} !important`,
        }"
				@click.stop
			>
				<!-- Для реальных объектов File -->
				<img
					:src="item.src"
					:alt="item.name || (item.file && item.file.name)"
					v-if="item.type === 'file' && item.file && item.file.type && item.file.type.includes('image/')"
					@click.stop
				/>

				<!-- Для URL-предпросмотров -->
				<img
					:src="item.src"
					:alt="item.name"
					v-if="item.type === 'url'"
					@click.stop
				/>

				<template v-if="item.type === 'file' && item.file && (!item.file.type || !item.file.type.includes('image/'))">
					<Icon
						:name="item.file ? item.file.name.split('.').pop() : 'file'"
						:mime="item.file ? item.file.type : undefined"
					/>
					<div class="file-title" v-if="item.name || item.file.name">{{ item.name || item.file.name }}</div>
				</template>
				<!-- Иконка типа файла для не-изображений -->

				<!-- Кнопка удаления (вынесена из img-details, чтобы быть всегда доступной) -->
				<div v-if="(allowSelectOnPreview || mode === 'edit')" @click.stop>
					<slot
						name="remove-button"
						:data="item"
						:removeFile="removeFileBuiltIn ? removeFileBuiltIn : removeFile"
					>
						<PreviewRemoveButton
							@click="removeFileBuiltIn ? removeFileBuiltIn(item) : removeFile(item)"
						/>
					</slot>
				</div>

				<!-- Оверлей с деталями файла -->
				<div class="img-details" v-if="allowSelectOnPreview && mode !== 'preview' && item.type === 'file' && item.file">
					<h2 v-if="item.name || item.file.name">{{ item.name || item.file.name }}</h2>
					<span v-if="item.size || item.file.size">{{ formatSize(item.size || item.file.size) }}</span>
				</div>

				<!-- Оверлей с деталями для URL-предпросмотров -->
				<div class="img-details" v-if="item.type === 'url' && allowSelectOnPreview">
					<h2 v-if="item.name">{{ item.name }}</h2>
					<span v-if="item.size">{{ formatSize(item.size) }}</span>
				</div>

				<!-- Прогресс-бар загрузки файла -->
				<div
					v-if="item.type === 'file' && (item.status === 'pending' || item.status === 'uploading')"
					@click.stop
				>
					<slot
						name="progress"
						:data="item"
						:progress="item.progress"
					>
						<PreviewProgressBar :progress="item.progress" />
					</slot>
				</div>
			</div>
		</slot>
	</div>
</template>

<script setup lang="ts">
	import type { PropType } from 'vue'
	import type { DropzoneItem, DropzoneMode } from '../types'
	import Icon from './Icon.vue'
	import PreviewProgressBar from './PreviewProgressBar.vue'
	import PreviewRemoveButton from './PreviewRemoveButton.vue'

	const props = defineProps({
		files: {
			type: Array as PropType<DropzoneItem[]>,
			default: () => [],
		},
		previewUrls: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		mode: {
			type: String as PropType<DropzoneMode>,
			default: 'drop',
			validator(value: string) {
				return ['drop', 'preview', 'edit'].includes(value)
			},
		},
		allowSelectOnPreview: {
			type: Boolean,
			default: false,
		},
		imgWidth: {
			type: [Number, String] as PropType<number | string | undefined>,
		},
		imgHeight: {
			type: [Number, String] as PropType<number | string | undefined>,
		},
		previewWrapperClasses: {
			type: [String, Array, Object] as PropType<string | string[] | Record<string, boolean>>,
			default: '',
		},
		removeFileBuiltIn: {
			type: Function as PropType<((item: DropzoneItem) => void) | undefined>,
		},
	})

	const emit = defineEmits<{
		(e: 'removeFile', item: DropzoneItem): void
		(e: 'click', event: MouseEvent): void
	}>()

	const formatSize = (size?: number): string => {
		if (!size) return 'Размер неизвестен'
		const i = Math.floor(Math.log(size) / Math.log(1024))
		return `${Number((size / Math.pow(1024, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB'][i]}`
	}

	const removeFile = (item: DropzoneItem): void => {
		emit('removeFile', item)
	}
</script>

<style scoped lang="scss">
	.preview-container {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 40px;
		padding: 2px;
	}

	.preview {
		width: 100%;
		height: 76%;
		border-radius: 8px;
		flex-shrink: 0;
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 16px;
		color: #455a64;


		.file-title {
			font-size: 0.9rem;
			display: block;
			max-width: 100%;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			margin: 10px;
		}
	}

	.preview__multiple {
		height: 150px;
		width: 150px;
	}

	.preview__file {
		border: 1px dashed rgba(var(--v3-dropzone--primary));
	}

	.preview__file--error {
		border-color: rgba(var(--v3-dropzone--error)) !important;
	}

	.preview:hover .img-details,
	.preview:hover :deep(.img-remove) {
		opacity: 1 !important;
		visibility: visible !important;
	}

	.preview img {
		width: 100%;
		height: 100%;
		border-radius: 8px;
		object-fit: cover;
	}

	.img-details {
		position: absolute;
		top: 0;
		inset-inline-start: 0;
		width: 100%;
		height: 100%;
		background: rgba(
				var(--v3-dropzone--overlay),
				var(--v3-dropzone--overlay-opacity)
		);
		border-radius: 8px;
		transition: all 0.2s linear;
		-webkit-backdrop-filter: blur(7px);
		backdrop-filter: blur(7px);
		filter: grayscale(1%);
		opacity: 0;
		visibility: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.img-details h2 {
		font-size: 14px;
		font-weight: 400;
		text-align: center;
		color: #fff;
		max-width: 40%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 400px) {
		.img-details h2 {
			max-width: 200px;
		}
	}

	.img-details span {
		font-size: 12px;
		font-weight: 600;
		text-align: center;
		color: #fff;
	}

	:deep(.img-remove) {
		background: rgba(var(--v3-dropzone--error));
		border-radius: 10px;
		border: none;
		padding: 5px;
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 10px;
		right: 10px;
		transition: all 0.2s linear;
		z-index: 30; /* Increased z-index to ensure it's on top */
		opacity: 0;
		visibility: hidden;
	}

	:deep(.img-remove):active {
		transform: scale(0.9);
	}

	:deep(.img-remove):hover {
		background: rgba(var(--v3-dropzone--error), 0.8);
	}

	:deep(.progress-bar-container) {
		position: absolute;
		bottom: 0;
		background-color: #666;
		border-radius: 5px;
		overflow: hidden;
		width: 100%;
		height: 10px;
	}

	:deep(.progress-bar) {
		height: 100%;
		background-color: rgba(var(--v3-dropzone--primary));
		text-align: center;
		font-size: 10px;
		line-height: 10px;
		color: #fff;
		width: 0;
		transition: width 0.5s ease-in-out;
	}
</style>
