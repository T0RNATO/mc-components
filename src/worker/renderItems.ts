import {BlockDefinition, BlockModel, Identifier, ItemRenderer, type Resources, TextureAtlas, type UV} from "deepslate";

// class taken from https://github.com/misode/misode.github.io/
class ResourceManager implements Resources {
    private readonly blockDefinitions: { [id: string]: BlockDefinition }
    private readonly blockModels: { [id: string]: BlockModel }
    private textureAtlas!: TextureAtlas

    constructor(blockDefinitions: Map<string, unknown>, models: Map<string, unknown>, uvMapping: any, textureAtlas: ImageData) {
        this.blockDefinitions = {}
        this.blockModels = {}
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

    private loadBlockAtlas(imageData: ImageData, textures: any) {const idMap: Record<string, UV> = {}
        Object.keys(textures).forEach(id => {
            const [u, v, du, dv] = textures[id]
            const dv2 = (du !== dv && id.startsWith('block/')) ? du : dv
            // 2048 should be changed (w,h,w,h)
            idMap[Identifier.create(id).toString()] = [u / 2048, v / 2048, (u + du) / 2048, (v + dv2) / 2048];
        })
        this.textureAtlas = new TextureAtlas(imageData, idMap)
    }
}

self.onmessage = async (msg) => {
    const {resources, ids, canvas} = msg.data as
        {canvas: OffscreenCanvas, resources: Object, ids: string[]};
    // @ts-ignore
    const manager = new ResourceManager(...resources);
    const gl = canvas.getContext('webgl')!;
    const renderer = new ItemRenderer(gl, new Identifier('minecraft', 'air'), manager);

    for (const item of ids) {
        renderer.setItem(new Identifier('minecraft', item));
        renderer.drawItem();

        const blob = await canvas.convertToBlob();

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        await new Promise((res) => {
            reader.onloadend = res;
        })

        self.postMessage({item, url: reader.result});
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
}