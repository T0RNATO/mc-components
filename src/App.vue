<script setup lang="ts">
import {computed, type Ref, ref} from "vue";
// @ts-ignore
import RenderItemsWorker from "./worker/renderItems.ts?worker";
import Item from "./components/Item.vue";
import {ItemComponents} from "~/types.ts";

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
    const response = await fetch(`${mcmetaUrl}/summary/item_components/data.json.gz`,
                        { headers: { 'User-Agent': navigator.userAgent } });
    const gzip = new DecompressionStream('gzip');
    const stream = response.body!.pipeThrough(gzip);
    const decompressedStream = new Response(stream);
    return decompressedStream.json();
}

const resources = new Promise<Object[]>(async (res) => {
    let blockDefinitions, blockModels, uvMappings, atlas, lang, components, items;

    if (import.meta.env.DEV) {
        // don't spam network requests
        [blockDefinitions, blockModels, uvMappings, items, lang, components, atlas] = (await Promise.all([ // @ts-ignore
            import('~/assets/dev/block_definition.json'), // @ts-ignore
            import('~/assets/dev/model_data.json'), // @ts-ignore
            import('~/assets/dev/atlas.json'), // @ts-ignore
            import('~/assets/dev/items.json'), // @ts-ignore
            import('~/assets/dev/lang.json'), // @ts-ignore
            import('~/assets/dev/components.json'),
            getImageData(`${mcmetaUrl}/atlas/all/atlas.png`),
        ])).map((el: {default: any}) => el.default ?? el);
    } else {
        [blockDefinitions, blockModels, uvMappings, items, lang, components, atlas] = await Promise.all([
            getMcMeta('summary/assets/block_definition'),
            getMcMeta('summary/assets/model'),
            getMcMeta('atlas/all'),
            getMcMeta('registries/item'),
            getMcMeta('assets/assets/minecraft/lang', 'en_us.json'),
            getDefaultComponents(),
            getImageData(`${mcmetaUrl}/atlas/all/atlas.png`),
        ])
    }
    itemIds.value = items;
    itemComponents.value = components;
    langFile.value = lang;

    res([blockDefinitions, blockModels, uvMappings, atlas]);
})

const langFile: Ref<Record<string, string>> = ref({});
const itemIds: Ref<string[]> = ref([]);
const itemURLS: Ref<Record<string, string>> = ref({});
const itemComponents: Ref<Record<string, ItemComponents>> = ref({});

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
const searchResults = computed(() => {
    const term = inputValue.value.toLowerCase();
    return itemIds.value.filter((item) => {
        const translated = langFile.value[`item.minecraft.${item}`] ?? langFile.value[`block.minecraft.${item}`] ?? '';
        return translated.toLowerCase().includes(term);
    });
})

const itemsPerRow = ref(Math.floor(window.innerWidth / 100) - 1);

window.addEventListener('resize', () => {
    itemsPerRow.value = Math.floor(window.innerWidth / 100) - 1;
})
</script>

<template>
    <div class="flex w-full items-center p-2 text-white flex-col">
        <h1 class="text-5xl font-bold text-center">Item Default Component Viewer</h1>
        <p class="text-center my-6">
            Search for an item or scroll down to it, and click it to view its information.
            <br/>
            Would not have been possible without the incredible work of Misode on both
            <a href="https://github.com/misode/deepslate">Deepslate</a> and
            <a href="https://github.com/misode/mcmeta">mcmeta</a>.
        </p>
        <input type="text" placeholder="Search here..."
               class="bg-gray-700 p-2 text-xl hover:bg-gray-600 transition-colors rounded-md w-full md:w-1/3"
               v-model="inputValue"
        >
    </div>
    <div class="flex flex-wrap gap-2 p-2 justify-center">
        <Item :item="langFile[`item.minecraft.${item}`] ?? langFile[`block.minecraft.${item}`] ?? ''"
              :url="itemURLS[item]"
              :key="item"
              :id="item"
              :components="itemComponents[item]"
              :lang="langFile"
              :i="i"
              :itemsPerRow="itemsPerRow"
              v-for="(item, i) in searchResults"
        />
    </div>
</template>