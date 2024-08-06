<script setup lang="ts">
import {ref} from "vue";
import {ItemComponents} from "~/types.ts";

defineProps<{
    url: string | undefined,
    item: string,
    i: number,
    id: string,
    lang: Record<string, string>,
    components: ItemComponents,
    itemsPerRow: number,
}>();

const active = ref(false);

function toTitle(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
}
</script>

<template>
<div class="item" @click="active = !active" :style="{order: i}" :class="{active}">
    <img :src="url" :alt="item" v-if="url"/>
    <div v-else class="text-gray-500 font-semibold w-full text-center">
        Loading...
    </div>
    <span class="text-center text-xs mt-2 text-gray-300">
        {{item}}
    </span>
</div>
<div class="bg-gray-800 w-full py-4 text-white flex justify-center" :style="{order: Math.ceil((i + 1) / itemsPerRow) * itemsPerRow}" v-if="active">
    <div class="components">
        <div class="flex flex-row items-center gap-x-2">
            <img :src="url" :alt="item" v-if="url"/>
            <div>
                <span class="text-md font-semibold mt-2 block">{{item}}</span>
                <span class="text-sm mt-2 text-gray-500">{{id}}</span>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-x-2 highlight">
            <span>Max Stack Size:</span><span>{{components["minecraft:max_stack_size"]}}</span>
            <span>minecraft:max_stack_size</span>
            <span>Rarity:</span><span :class="components['minecraft:rarity']">{{toTitle(components["minecraft:rarity"])}}</span>
            <span>minecraft:rarity</span>
            <template v-if="components['minecraft:max_damage']">
                <span>Durability:</span><span>{{components["minecraft:max_damage"]}}</span>
                <span>minecraft:max_damage</span>
            </template>
            <template v-if="components['minecraft:fire_resistant']">
                <span>Fire Resistant:</span><span>{}</span>
                <span>minecraft:fire_resistant</span>
            </template>
        </div>
        <template v-if="components['minecraft:attribute_modifiers'].modifiers.length"
                  v-for="modifier in components['minecraft:attribute_modifiers'].modifiers">
            <div>
                <span class="font-semibold block">{{lang['attribute.name.' + modifier.type.split(':')[1]]}}</span>
                <span class="text-gray-500 text-sm">{{modifier.type}}</span>
            </div>
            <div class="grid grid-cols-3 gap-x-2 highlight">
                <span>Affects:</span>
                <span>{{modifier.slot}}</span>
                <span></span>
                <span>Operation: </span>
                <span>{{modifier.operation}}</span>
                <span></span>
                <span>Amount:</span>
                <span>{{Math.round(modifier.amount * 1000) / 1000}}</span>
                <span v-if="modifier.operation == 'add_value'">
                    Base {{Math.sign(modifier.amount) == 1 ? '+' : '-'}}
                    {{Math.round(Math.abs(modifier.amount) * 1000) / 1000}}
                </span>
                <span v-else>
                    Base × {{Math.round(modifier.amount * 1000) / 1000 + 1}}
                </span>
            </div>
        </template>
        <template v-if="components['minecraft:tool']"
                  v-for="rule in components['minecraft:tool']!.rules">
            <div>
                <span class="font-semibold block">Tool Rule</span>
                <span class="text-gray-500 text-sm">{{rule.blocks}}</span>
            </div>
            <div class="grid grid-cols-3 gap-x-2 highlight">
                <template v-if="rule.speed">
                    <span>Speed: </span>
                    <span>{{rule.speed}}</span>
                    <span></span>
                </template>
                <span>Drops items:</span>
                <span>{{rule.correct_for_drops}}</span>
                <span>correct_for_drops</span>
            </div>
        </template>
        <template v-if="components['minecraft:food']">
            <div>
                <span class="font-semibold block">Food</span>
                <span class="text-gray-500 text-sm">minecraft:food</span>
            </div>
            <div class="grid grid-cols-3 gap-x-2 highlight">
                <span>Nutrition:</span>
                <span>{{components['minecraft:food'].nutrition}}</span>
                <span></span>
                <span>Saturation:</span>
                <span>{{components['minecraft:food'].saturation}}</span>
                <span></span>
                <span>Can eat regardless of hunger:</span>
                <span>{{components['minecraft:food'].can_always_eat ?? false}}</span>
                <span>can_always_eat</span>
                <template v-if="components['minecraft:food'].using_converts_to">
                    <span>Converts to when eaten: </span>
                    <span>{{components['minecraft:food'].using_converts_to.id}}</span>
                    <span>using_converts_to</span>
                </template>
            </div>
        </template>
    </div>
</div>
</template>

<!--suppress CssUnusedSymbol -->
<style scoped>
.item {
    @apply p-2 rounded-md bg-gray-800 w-[100px] flex justify-center flex-col cursor-pointer hover:bg-gray-700 transition-colors;
}
.components {
    @apply flex flex-col md:grid md:grid-cols-2 md:justify-center items-center gap-6 px-2;
    > div:nth-child(odd) {
        @apply md:border-r-2 max-sm:border-b-2 border-gray-500 md:pr-6 max-sm:pb-6
    }
    > div {
        @apply max-sm:w-full
    }
}
.highlight {
    > span:nth-child(3n+1) {
        @apply font-semibold;
    }
    > span:nth-child(3n) {
        @apply text-gray-500 max-sm:text-xs;
    }
}
.active {
    @apply bg-gray-700;
}
.uncommon { color: #FFFF55; }
.rare { color: #55FFFF; }
.epic { color: #FF55FF; }
</style>