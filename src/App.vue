<template>
  <form class="app">
    <Vue3Dropzone v-model="sampleFiles" />
  </form>
</template>

<script setup>
import {ref} from 'vue'
import Vue3Dropzone from './components/Vue3Dropzone.vue'

const sampleFiles = ref([]);
</script>

<style scoped>
</style>