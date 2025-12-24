<template>
	<Preview v-bind="previewProps" @click="$emit('click', $event)" @mouseover="$emit('mouseover', $event)" @mouseleave="$emit('mouseleave', $event)">
		<template #preview="slotProps">
			<slot name="preview" v-bind="slotProps"></slot>
		</template>
		<template #remove-button="slotProps">
			<slot name="remove-button" v-bind="slotProps"></slot>
		</template>
		<template #progress="slotProps">
			<slot name="progress" v-bind="slotProps"></slot>
		</template>
	</Preview>
</template>

<script setup lang="ts">
	import { computed, type PropType } from 'vue'
	import type { DropzoneItem, DropzoneMode } from '../types'
	import Preview from './Preview.vue'

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
		},
	})

	const emit = defineEmits<{
		(e: 'removeFile', file: DropzoneItem): void
		(e: 'click', event: MouseEvent): void
		(e: 'mouseover', event: MouseEvent): void
		(e: 'mouseleave', event: MouseEvent): void
	}>()

	const previewProps = computed(() => ({
		...props,
		removeFileBuiltIn: (file: DropzoneItem) => emit('removeFile', file),
	}))
</script>
