<script setup lang="ts">
import {computed, type Ref, ref} from "vue";
// @ts-ignore
import RenderItemsWorker from "./worker/renderItems.ts?worker";
import Item from "./components/Item.vue";

const mcmetaUrl = 'https://raw.githubusercontent.com/misode/mcmeta'

async function getMcMeta(path: string, name: string = 'data.min.json') {
    return (await fetch(`${mcmetaUrl}/${path}/${name}`)).json()
}

async function getImageData(src: string) {
    return new Promise<ImageData>(res => {
        const image = new Image()
        image.onload = () => {
            const atlasCanvas = document.createElement('canvas');
            const w = 2048; // should be changed in case atlas increases in size
            const h = 2048;
            atlasCanvas.width = w;
            atlasCanvas.height = h;
            const ctx = atlasCanvas.getContext('2d')!;
            ctx.drawImage(image, 0, 0);
            res(ctx.getImageData(0, 0, w, h));
        };
        image.crossOrigin = 'Anonymous';
        image.src = src;
    })
}

async function getDefaultComponents() {
    const response = await fetch('https://raw.githubusercontent.com/misode/mcmeta/summary/item_components/data.json.gz',
                        { headers: { 'Content-Encoding': 'gzip' } });
    const gzip = new DecompressionStream('gzip');
    const stream = response.body.pipeThrough(gzip);
    const decompressedStream = new Response(stream);
    return decompressedStream.json();
}

const resources = new Promise<Object[]>(async (res) => {
    let blockDefinitions, blockModels, uvMappings, atlas, lang, items;

    if (import.meta.env.DEV) {
        // don't spam network requests
        [blockDefinitions, blockModels, uvMappings, items, lang, atlas] = await Promise.all([ // @ts-ignore
            import('/src/assets/dev/block_definition.json'), // @ts-ignore
            import('/src/assets/dev/model_data.json'), // @ts-ignore
            import('/src/assets/dev/atlas.json'), // @ts-ignore
            import('/src/assets/dev/items.json'), // @ts-ignore
            import('/src/assets/dev/lang.json'),
            getImageData(`${mcmetaUrl}/atlas/all/atlas.png`),
        ])

        blockDefinitions = blockDefinitions.default;
        blockModels = blockModels.default;
        uvMappings = uvMappings.default;
        itemIds.value = items.default;
    } else {
        [blockDefinitions, blockModels, uvMappings, items, lang, atlas] = await Promise.all([
            getMcMeta('summary/assets/block_definition'),
            getMcMeta('summary/assets/model'),
            getMcMeta('summary/atlas/all'),
            getMcMeta('registries/item'),
            getMcMeta('assets/assets/minecraft/lang', 'en_us.json'),
            getImageData(`${mcmetaUrl}/atlas/all/atlas.png`),
        ])
        itemIds.value = items;
    }

    langFile = lang.default;

    console.log([blockDefinitions, blockModels, uvMappings, atlas]);
    res([blockDefinitions, blockModels, uvMappings, atlas]);
})

let langFile: Record<string, string> = {};
const itemIds: Ref<string[]> = ref([]);
const itemURLS: Ref<Record<string, string>> = ref({});

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 64;
const offscreen = canvas.transferControlToOffscreen();

resources.then((resources) => {
    const worker: Worker = new RenderItemsWorker()
    // _rawValue is undocumented but is a reference to the non-proxied value (the proxy cannot be transferred)
    // @ts-ignore
    worker.postMessage({canvas: offscreen, ids: itemIds._rawValue, resources}, [offscreen]);
    worker.onmessage = (msg) => {
        const {item, url} = msg.data;
        itemURLS.value[item] = url;
    }
})

const inputValue = ref('');
const searchTerm = computed(() => {
    return inputValue.value.toLowerCase();
})
</script>

<template>
    <div class="flex w-full justify-center p-2">
        <input type="text"
               class="bg-gray-700 p-2 text-xl text-white hover:bg-gray-600 transition-colors rounded-md w-1/3"
               v-model="inputValue"
        >
    </div>
    <div class="flex flex-wrap gap-2 p-2">
        <!--todo: update `i` when search term present-->
        <Item :item="langFile[`item.minecraft.${item}`] ?? langFile[`block.minecraft.${item}`] ?? ''"
              :url="itemURLS[item]"
              :key="item"
              :search="searchTerm"
              :id="item"
              :i="i"
              v-for="(item, i) in itemIds"
        />
    </div>
</template>

<style scoped>

</style>
