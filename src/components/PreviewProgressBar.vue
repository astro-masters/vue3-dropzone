<template>
  <div class="progress-bar-container">
    <div
      class="progress-bar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :style="{ width: `${progress}%` }"
    >
      {{ progress }}%
    </div>
  </div>
</template>

<script setup lang="ts">
 defineProps<{
   progress: number
 }>()
</script>
