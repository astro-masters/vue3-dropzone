<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="40"
    height="40"
    fill="currentColor"
  >
    <path :d="iconPath" />
  </svg>
</template>

<script setup lang="ts">
 import { computed } from 'vue'
 import { resolveFileIconKind, resolveFileIconPath } from '../utils/fileIcons'

 const props = defineProps<{
   name?: string
   mime?: string
 }>()

 const ext = computed(() => {
   if (!props.name) return ''
   return String(props.name).trim().toLowerCase()
 })

 const mime = computed(() => {
   if (!props.mime) return ''
   return String(props.mime).trim().toLowerCase()
 })

 const kind = computed(() =>
   resolveFileIconKind({
     extension: ext.value,
     mime: mime.value,
   }),
 )

 const iconPath = computed(() => resolveFileIconPath(kind.value))
</script>

<style scoped lang="scss">

</style>