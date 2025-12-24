<template>
  <form class="app">
    <Vue3Dropzone v-model="sampleFiles" />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Vue3Dropzone from './components/Vue3Dropzone.vue'
import type { DropzoneFileItem } from './types'

const sampleFiles = ref<DropzoneFileItem[]>([])
</script>

<style scoped lang="scss">
</style>