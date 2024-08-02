<script setup lang="ts">
import {ref} from "vue";

defineProps<{
    url: string | undefined,
    item: string,
    search: string,
    i: number,
    id: string,
}>();

const active = ref(false);
</script>

<template>
<div class="item" v-if="item.toLowerCase().includes(search)" @click="active = !active" :style="{order: i}">
    <img :src="url" :alt="item" v-if="url"/>
    <div v-else class="text-gray-500 font-semibold w-full text-center">
        Loading...
    </div>
    <span class="text-center text-xs mt-2 text-gray-300">
        {{item}}
    </span>
</div>
<div class="bg-gray-800 w-full h-20 flex justify-center" :style="{order: Math.ceil((i + 1) / 13) * 13}" v-if="active">
    <div class="flex flex-row items-center gap-x-2">
        <img :src="url" :alt="item" v-if="url"/>
        <div>
            <span class="text-md font-semibold mt-2 text-white block">{{item}}</span>
            <span class="text-xs mt-2 text-gray-300">{{id}}</span>
        </div>
    </div>
</div>
</template>

<style scoped>
.item {
    @apply p-2 rounded-md bg-gray-800 w-[7%] flex justify-center flex-col cursor-pointer hover:bg-gray-700 transition-colors;
}
</style>