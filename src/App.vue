<script setup lang="ts">
import {
    type UV,
    type Resources,
    ItemRenderer,
    Identifier,
    BlockDefinition,
    BlockModel,
    TextureAtlas,
} from 'deepslate';
import {type Ref, ref} from "vue";

class ResourceManager implements Resources {
    private readonly blockDefinitions: { [id: string]: BlockDefinition }
    private readonly blockModels: { [id: string]: BlockModel }
    private textureAtlas: TextureAtlas

    constructor(blockDefinitions: Map<string, unknown>, models: Map<string, unknown>, uvMapping: any, textureAtlas: HTMLImageElement) {
        this.blockDefinitions = {}
        this.blockModels = {}
        this.textureAtlas = TextureAtlas.empty()
        this.loadBlockDefinitions(blockDefinitions)
        this.loadBlockModels(models)
        this.loadBlockAtlas(textureAtlas, uvMapping)
    }

    public getBlockDefinition(id: Identifier) {
        return this.blockDefinitions[id.toString()]
    }

    public getBlockModel(id: Identifier) {
        return this.blockModels[id.toString()]
    }

    public getTextureUV(id: Identifier) {
        return this.textureAtlas.getTextureUV(id)
    }

    public getTextureAtlas() {
        return this.textureAtlas.getTextureAtlas()
    }

    public getBlockFlags() {
        return { opaque: false }
    }

    public getBlockProperties() {
        return null
    }

    public getDefaultBlockProperties() {
        return null
    }

    private loadBlockModels(models: Map<string, unknown>) {
        [...Object.entries(models)].forEach(([id, model]) => {
            this.blockModels[Identifier.create(id).toString()] = BlockModel.fromJson(id, model)
        })
        Object.values(this.blockModels).forEach(m => m.flatten(this))
    }

    private loadBlockDefinitions(definitions: Map<string, unknown>) {
        [...Object.entries(definitions)].forEach(([id, definition]) => {
            this.blockDefinitions[Identifier.create(id).toString()] = BlockDefinition.fromJson(id, definition)
        })
    }

    private loadBlockAtlas(image: HTMLImageElement, textures: any) {
        const atlasCanvas = document.createElement('canvas')
        const w = 2048;
        const h = 2048;
        atlasCanvas.width = w
        atlasCanvas.height = h
        const ctx = atlasCanvas.getContext('2d')!
        ctx.drawImage(image, 0, 0)
        const imageData = ctx.getImageData(0, 0, w, h)

        const idMap: Record<string, UV> = {}
        Object.keys(textures).forEach(id => {
            const [u, v, du, dv] = textures[id]
            const dv2 = (du !== dv && id.startsWith('block/')) ? du : dv
            idMap[Identifier.create(id).toString()] = [u / w, v / h, (u + du) / w, (v + dv2) / h]
        })
        this.textureAtlas = new TextureAtlas(imageData, idMap)
    }
}

const mcmetaUrl = 'https://raw.githubusercontent.com/misode/mcmeta'

async function getMcMeta(path: string, name: string = 'data.min.json') {
    return (await fetch(`${mcmetaUrl}/${path}/${name}`)).json()
}

async function loadImage(src: string) {
    return new Promise<HTMLImageElement>(res => {
        const image = new Image()
        image.onload = () => res(image);
        image.crossOrigin = 'Anonymous';
        image.src = src;
    })
}

const resources = new Promise<ResourceManager>(async (res) => {
    let blockDefinitions, blockModels, uvMappings, atlas, lang, items;

    if (import.meta.env.DEV) {
        // don't spam network requests
        [blockDefinitions, blockModels, uvMappings, items, lang, atlas] = await Promise.all([ // @ts-ignore
            import('/src/assets/dev/block_definition.json'), // @ts-ignore
            import('/src/assets/dev/model_data.json'), // @ts-ignore
            import('/src/assets/dev/atlas.json'), // @ts-ignore
            import('/src/assets/dev/items.json'), // @ts-ignore
            import('/src/assets/dev/lang.json'),
            loadImage(`${mcmetaUrl}/atlas/all/atlas.png`),
        ])

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
            loadImage(`${mcmetaUrl}/atlas/all/atlas.png`),
        ])
    }

    langFile = lang.default;

    const r = new ResourceManager(blockDefinitions, blockModels, uvMappings, atlas);

    res(r);
})

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 64;
const gl = canvas.getContext('webgl')!;

let langFile: Record<string, string> = {};
const itemIds: Ref<string[]> = ref([]);
const itemURLS: Ref<Record<string, string>> = ref({});

resources.then((resources) => {
    const renderer = new ItemRenderer(gl, new Identifier('minecraft', 'air'), resources);
    requestIdleCallback(renderItemsChunk.bind(null, renderer), {timeout: 20});
})

let itemLoadedIndex = 0;

function renderItemsChunk(renderer: ItemRenderer, deadline: IdleDeadline) {

    while (itemLoadedIndex < itemIds.value.length && deadline.timeRemaining() > 10) {
        const item = itemIds.value[itemLoadedIndex];

        renderer.setItem(new Identifier('minecraft', item));
        renderer.drawItem();
        itemURLS.value[item] = canvas.toDataURL();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        itemLoadedIndex++;
    }
    if (itemLoadedIndex < itemIds.value.length) {
        requestIdleCallback(renderItemsChunk.bind(null, renderer), {timeout: 20});
    }
}
</script>

<template>
    <div class="flex w-full justify-center p-2">
        <input type="text" class="bg-gray-700 p-2 text-xl text-white hover:bg-gray-600 transition-colors rounded-md w-1/3">
    </div>
    <div class="flex flex-wrap gap-2 p-2">
        <div v-for="item in itemIds" :key="item" class="item">
            <img :src="itemURLS[item]" :alt="item" v-if="itemURLS[item]"/>
            <div v-else class="text-gray-500 font-semibold w-full text-center">
                Loading...
            </div>
            <span class="text-center text-xs mt-2 text-gray-300">
                {{langFile[`item.minecraft.${item}`] ?? langFile[`block.minecraft.${item}`]}}
            </span>
        </div>
    </div>
</template>

<style scoped>
.item {
    @apply p-2 rounded-md bg-gray-800 w-[7%] flex justify-center flex-col cursor-pointer hover:bg-gray-700 transition-colors;
}
</style>
