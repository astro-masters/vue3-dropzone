# Vue3 Dropzone

A flexible Vue 3 dropzone component with unified preview and edit capabilities. Perfect for file uploads, image
galleries, and product management interfaces.
    <a href="https://vue3-dropzone-docs.vercel.app/"><strong>Demo</strong></a>
    <a href="./doc/ru/README.md"><strong>Документация на русском</strong></a>

## 🚀 Getting Started

### Installation

```bash
npm install @astro-masters/vue3-dropzone-ts
# or
yarn add @astro-masters/vue3-dropzone-ts
```

### Basic Usage

```js
// In your main.js
import { createApp } from 'vue'
import Vue3Dropzone from '@astro-masters/vue3-dropzone-ts'
import "@astro-masters/vue3-dropzone-ts/style.css" // Don't forget to import the styles!

const app = createApp(App)
app.component('Vue3Dropzone', Vue3Dropzone)

// OR in your component file (local registration)
import Vue3Dropzone from '@astro-masters/vue3-dropzone-ts'
import "@astro-masters/vue3-dropzone-ts/style.css"
```

### Minimal Example

```vue
<template>
  <Vue3Dropzone v-model="files" />
</template>

<script setup>
import { ref } from 'vue'

const files = ref([])
</script>
```

### Complete Example

```vue
<template>
  <Vue3Dropzone 
    v-model="files" 
    multiple
    width="100%" 
    height="400px" 
    imgWidth="45%" 
    imgHeight="300px"
    :maxFileSize="10"
    :maxFiles="2"
    :state="state"
  />
</template>

<script setup>
import { ref } from 'vue'

const files = ref([])
const state = ref('indeterminate') // Can be 'indeterminate', 'success', or 'error'
</script>
```

## TypeScript

The package ships with TypeScript types and re-exports them from the main entry.

### Typed v-model example

```vue
<template>
  <Vue3Dropzone
    v-model="files"
    v-model:previews="previews"
    mode="edit"
    multiple
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Vue3Dropzone, { type DropzoneFileItem } from '@astro-masters/vue3-dropzone-ts'

const files = ref<DropzoneFileItem[]>([])
const previews = ref<string[]>([])
</script>
```

### Types reference

| Type | Description |
|---|---|
| `DropzoneMode` | `'drop' | 'preview' | 'edit'` |
| `DropzoneState` | `'error' | 'success' | 'indeterminate'` |
| `DropzoneStatus` | `'pending' | 'uploading' | 'success' | 'error'` |
| `DropzonePreviewPosition` | `'inside' | 'outside'` |
| `DropzoneSelectFileStrategy` | `'replace' | 'merge'` |
| `DropzoneItemType` | `'file' | 'url'` |
| `DropzoneBaseItem` | Common fields for preview items |
| `DropzoneFileItem` | Item with real `File` object (`type: 'file'`) |
| `DropzoneUrlItem` | Item for existing preview URL (`type: 'url'`) |
| `DropzoneItem` | Union: `DropzoneFileItem | DropzoneUrlItem` |
| `DropzoneErrorType` | Validation / request error type |
| `DropzoneErrorEvent` | `{ type, files }` payload of `error` event |
| `DropzoneUploadRequestEvent` | Payload of `upload-request` event (external upload handler) |
| `DropzoneRemoveRequestEvent` | Payload of `remove-request` event (external remove handler) |

### Version Support
- Vue.js 3.x
- Modern browsers with ES6 support

## Server-side upload/remove: external handlers (events)

When `serverSide` is enabled, the component can upload/delete files using:

- Your external handler via events `upload-request` / `remove-request`
- Built-in `XMLHttpRequest` (fallback) if no listener is provided

This approach lets you use `axios`, `fetch`, custom auth, custom API contracts, etc., while the component keeps:

- Updating `fileItem.status`, `fileItem.message`, `fileItem.progress`
- Emitting `fileUploaded` on success
- Emitting `error` with `type: 'upload-error' | 'delete-error'` on failures

### Upload example (Axios + progress)

```vue
<template>
  <Vue3Dropzone
    v-model="files"
    :server-side="true"
    upload-endpoint="https://api.example.com/upload"
    server-file-id-key="file_id"
    :headers="{ Authorization: `Bearer ${token}` }"
    @upload-request="onUploadRequest"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import Vue3Dropzone, { type DropzoneFileItem, type DropzoneUploadRequestEvent } from '@astro-masters/vue3-dropzone-ts'

const token = '...'
const files = ref<DropzoneFileItem[]>([])

const onUploadRequest = async (e: DropzoneUploadRequestEvent) => {
  try {
    const response = await axios.post(e.endpoint, e.formData, {
      headers: e.headers,
      onUploadProgress: (pe) => {
        if (!pe.total) return
        e.progress((pe.loaded / pe.total) * 100)
      },
    })
    e.success(response?.data)
  } catch (err: any) {
    e.error(err?.message ?? 'Upload failed', err)
  }
}
</script>
```

### Remove example (Axios)

```vue
<template>
  <Vue3Dropzone
    v-model="files"
    :server-side="true"
    delete-endpoint="https://api.example.com/files"
    :headers="{ Authorization: `Bearer ${token}` }"
    @remove-request="onRemoveRequest"
  />
</template>

<script setup lang="ts">
import axios from 'axios'
import type { DropzoneRemoveRequestEvent } from '@astro-masters/vue3-dropzone-ts'

const token = '...'

const onRemoveRequest = async (e: DropzoneRemoveRequestEvent) => {
  try {
    await axios.delete(e.endpoint, { headers: e.headers })
    e.success()
  } catch (err: any) {
    e.error(err?.message ?? 'Remove failed', err)
  }
}
</script>
```

## 🎯 Key Features

### **Unified Data Handling**

- **Multiple Data Sources**: Combines File objects (new uploads) with URL strings (existing files)
- **Smart Type Detection**: Automatically handles different file types and sources
- **Two-Way Binding**: Reactive updates for both new files and existing previews

### **Three Flexible Modes**

- **Drop Mode**: Standard dropzone for new file selection
- **Preview Mode**: Display existing files with optional interaction (can be enhanced with `allowSelectOnPreview`)
- **Edit Mode**: Combined functionality - show existing files AND allow full modification capabilities (add, remove, replace)

### **File Management**

- **Drag & Drop Support**: Native HTML5 drag and drop with visual feedback
- **File Validation**: Size limits, type restrictions, and custom validation
- **Progress Tracking**: Built-in upload progress with server-side support
- **Error Handling**: Comprehensive error states and user feedback

### **Non-image previews (icons)**

For non-image files the preview shows a file type icon and the filename. File type is detected using MIME type and/or extension.

| Kind | Extensions / MIME examples |
|---|---|
| `pdf` | `.pdf`, `application/pdf` |
| `xlsx` | `.xls`, `.xlsx`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `csv` | `.csv`, `text/csv` |
| `audio` | `audio/*`, `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.aac` |
| `video` | `video/*`, `.mp4`, `.mkv`, `.webm`, `.mov`, `.avi`, `.mpeg`, `.mpg`, `.m4v` |
| `doc` | `.doc`, `.docx`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `ppt` | `.ppt`, `.pptx`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| `archive` | `.zip`, `.tar`, `.gz`, `.tgz`, `.rar`, `.7z` |
| `default` | anything else |

### **Layout Options**

- **Preview Positioning**: Display previews inside or outside the dropzone
- **Responsive Design**: Adapts to different screen sizes and containers
- **Customizable Styling**: CSS variables for easy theming
- **Slot Support**: Override any part of the interface

## 📋 Props Reference

### **Core Configuration**

| Prop         | Type      | Default  | Description                                                                                                        |
|--------------|-----------|----------|--------------------------------------------------------------------------------------------------------------------|
| `modelValue` | `Array`   | `[]`     | Array of File objects representing newly selected files. Two-way binding with v-model.                             |
| `previews`   | `Array`   | `[]`     | Array of URL strings for existing files/images. Two-way binding with v-model:previews.                             |
| `mode`       | `String`  | `"drop"` | Component behavior mode: `"drop"` (new files only), `"preview"` (display only, can be enhanced with `allowSelectOnPreview`), `"edit"` (combined functionality with full file management capabilities). Edit mode automatically enables file selection and removal, and has special behaviors like clearing previews when using replace strategy. |
| `multiple`   | `Boolean` | `false`  | Allow selection of multiple files simultaneously.                                                                  |
| `disabled`   | `Boolean` | `false`  | Completely disable all interactions with the dropzone.                                                             |

### **File Selection & Strategy**

| Prop                   | Type      | Default     | Description                                                                                                                                                                                                                                             |
|------------------------|-----------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `selectFileStrategy`   | `String`  | `"replace"` | How new files interact with existing ones: `"replace"` (clear existing), `"merge"` (add to existing).                                                                                                                                                   |
| `allowSelectOnPreview` | `Boolean` | `false`     | Allow file selection and removal in preview mode. When true, clicking on empty areas in the preview container triggers file selection, while clicks on images and preview items are prevented to avoid accidental selection. This adds limited interactivity to preview mode without enabling all edit mode features. When false, preview mode is read-only. Note: For full editing capabilities, use `mode="edit"` instead. |
| `ignoreOriginalPreviews` | `Boolean` | `false`     | When true and using replace strategy in preview mode, original preview URLs are permanently hidden after new files are selected, even if all new files are removed. When false, original previews reappear when new files are removed. |
| `maxFiles`             | `Number`  | `5`         | Maximum number of files that can be selected at once.                                                                                                                                                                                                   |
| `maxFileSize`          | `Number`  | `5`         | Maximum file size allowed in megabytes (MB).                                                                                                                                                                                                            |
| `accept`               | `String`  | `undefined` | Comma-separated list of allowed file types (MIME types). Example: "image/*,application/pdf".                                                                                                                                                            |

### **Visual Layout & Positioning**

| Prop                    | Type            | Default    | Description                                                                                 |
|-------------------------|-----------------|------------|---------------------------------------------------------------------------------------------|
| `width`                 | `Number/String` | `auto`     | Width of the dropzone container. Can be px, %, or any CSS unit.                             |
| `height`                | `Number/String` | `200px`    | Height of the dropzone container. Can be px, %, or any CSS unit.                            |
| `previewPosition`       | `String`        | `"inside"` | Where to display file previews: `"inside"` (within dropzone), `"outside"` (below dropzone). |
| `imgWidth`              | `Number/String` | `auto`     | Width of individual preview images.                                                         |
| `imgHeight`             | `Number/String` | `auto`     | Height of individual preview images.                                                        |
| `previewWrapperClasses` | `String`        | `""`       | Additional CSS classes to apply to the preview container.                                   |

### **User Interface Elements**

| Prop               | Type      | Default           | Description                                                                                     |
|--------------------|-----------|-------------------|-------------------------------------------------------------------------------------------------|
| `showSelectButton` | `Boolean` | `true`            | Display the "Select File" button within the dropzone interface.                                 |
| `fileInputId`      | `String`  | `auto-generated`  | Custom ID for the hidden file input element. Auto-generated if not provided.                    |
| `state`            | `String`  | `"indeterminate"` | Visual state of the dropzone: `"indeterminate"`, `"success"`, `"error"`. Affects border colors. |

### **Server Integration**

| Prop             | Type      | Default     | Description                                                          |
|------------------|-----------|-------------|----------------------------------------------------------------------|
| `serverSide`     | `Boolean` | `false`     | Enable server-side file upload functionality with progress tracking. |
| `uploadEndpoint` | `String`  | `undefined` | URL endpoint for file uploads when serverSide is enabled.            |
| `deleteEndpoint` | `String`  | `undefined` | URL endpoint for file deletion when serverSide is enabled.           |
| `serverFileIdKey` | `String` | `undefined` | Key/path in upload response used to replace `fileItem.id` (e.g. `file_id`, `data.file_id`). |
| `headers`        | `Object`  | `{}`        | Additional HTTP headers to send with server requests.                |

## 🔄 Events Reference

| Event               | Payload  | Description                                                                     |
|---------------------|----------|---------------------------------------------------------------------------------|
| `update:modelValue` | `Array`  | Emitted when the files array changes. Contains File objects.                    |
| `update:previews`   | `Array`  | Emitted when the previews array changes. Contains URL strings.                  |
| `drop`              | `Event`  | Emitted when files are dropped onto the dropzone.                               |
| `fileUploaded`      | `Object` | Emitted when a file successfully uploads (server-side mode).                    |
| `fileRemoved`       | `Object` | Emitted when a File object is removed from the list.                            |
| `previewRemoved`    | `Object` | Emitted when a preview URL is removed from the list.                            |
| `error`             | `Object` | Emitted on validation errors or upload failures. Contains error type and files. |

## 🎨 Styling & Customization

### **CSS Variables**

The component uses CSS custom properties for easy theming:

| Variable                         | Default         | Purpose                               |
|----------------------------------|-----------------|---------------------------------------|
| `--v3-dropzone--primary`         | `94, 112, 210`  | Primary color (RGB values)            |
| `--v3-dropzone--border`          | `214, 216, 220` | Border color (RGB values)             |
| `--v3-dropzone--description`     | `190, 191, 195` | Description text color (RGB values)   |
| `--v3-dropzone--error`           | `255, 76, 81`   | Error state color (RGB values)        |
| `--v3-dropzone--success`         | `36, 179, 100`  | Success state color (RGB values)      |
| `--v3-dropzone--overlay`         | `40, 44, 53`    | Overlay background color (RGB values) |
| `--v3-dropzone--overlay-opacity` | `0.3`           | Overlay opacity value                 |

### **Slot Support**

Override default content with custom implementations:

| Slot | Purpose |
|---|---|
| `placeholder-img` | Replace the default placeholder image |
| `title` | Replace the default "Drop your files here" title |
| `button` | Replace the default "Select File" button |
| `description` | Replace the default file requirements description |
| `preview` | Custom preview item rendering |
| `remove-button` | Replace the remove button in preview items |
| `progress` | Replace the progress bar in preview items |

#### Slot props

| Slot | Props |
|---|---|
| `preview` | `{ data, formatSize, removeFile }` |
| `remove-button` | `{ data, removeFile }` |
| `progress` | `{ data, progress }` |

#### Custom remove button example

```vue
<template>
  <Vue3Dropzone v-model="files" mode="edit">
    <template #remove-button="{ data, removeFile }">
      <button type="button" @click.stop="removeFile(data)">Remove</button>
    </template>
  </Vue3Dropzone>
</template>
```

## 🔧 Component Methods

Access these methods via template ref:

| Method            | Parameters | Description                               |
|-------------------|------------|-------------------------------------------|
| `clearFiles()`    | None       | Remove all File objects (new uploads)     |
| `clearPreviews()` | None       | Remove all preview URLs (existing files)  |
| `clearAll()`      | None       | Remove both files and previews completely |
| `clearPreview()`  | None       | Legacy method - equivalent to clearAll()  |

## 🎯 Use Cases

### **Product Management**

Perfect for e-commerce platforms where users need to manage product images - showing existing images while allowing
additions, removals, and replacements.

### **Profile/Avatar Updates**

Ideal for user profile interfaces where you display current profile pictures and allow users to upload new ones.

### **Document Management**

Great for document upload interfaces where users can see existing documents and add new ones.

### **Gallery Applications**

Excellent for photo gallery management where users can view existing images and upload additional ones.

### **Content Management Systems**

Perfect for CMS interfaces where content creators need to manage media files alongside text content.

### **General Media Management Admin Panels**

Ideal for administrative interfaces across various platforms where administrators need to manage user-uploaded content,
system assets, or shared media libraries. Works well for social platforms, educational systems, corporate portals, and
any application requiring centralized media administration.

## 🚀 Features

### **File Handling**

- Automatically detects file types and displays appropriate previews
- Handles both image files (with thumbnails) and other file types (with icons)
- Maintains file metadata and upload status

### **Interaction Models**

- Read-only preview mode for display purposes
- Interactive preview mode for file management
- Combined edit mode for comprehensive file management
- Smart click handling:
    - Click on empty preview container areas to select new files
    - Click prevention on images and preview items to avoid accidental file selection
    - Dedicated remove buttons for each preview item

### **Responsive Design**

- Adapts to container sizes automatically
- Supports both fixed and flexible dimensions
- Mobile-friendly touch interactions

### **Error Prevention**

- File size validation before upload
- File type validation against accepted formats
- Clear error messaging for user guidance

This component provides a complete solution for file management interfaces with the flexibility to adapt to various use
cases and design requirements.
