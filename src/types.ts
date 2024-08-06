export type ItemComponents = {
    "minecraft:attribute_modifiers": {
        "modifiers": {
            "type": string,
            "amount": number,
            "id": string,
            "operation": "add_value" | "add_multiplied_base" | "add_multiplied_total",
            "slot": string
        }[]
    },
    "minecraft:enchantments": {
        "levels": Record<string, number>
    },
    "minecraft:max_stack_size": number,
    "minecraft:rarity": "common" | 'rare' | 'epic' | 'uncommon'
    "minecraft:repair_cost": number
    "minecraft:fire_resistant"?: {},
    "minecraft:max_damage"?: number,
    "minecraft:tool"?: {
        "rules": {
            "blocks": string,
            "correct_for_drops": boolean,
            "speed"?: number
        }[]
    },
    "minecraft:food": {
        "nutrition": number,
        "saturation": number,
        "can_always_eat"?: boolean,
        "using_converts_to"?: {
            "id": string;
        }
    },
}