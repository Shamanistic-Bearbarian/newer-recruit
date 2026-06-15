// PLACEHOLDER DATA — not real game rules.
// Values are invented for development of the list builder. Replace with
// official Warhammer 40,000 11th edition data when it is released.

import type { Faction } from "@/data/types";

export const necrons: Faction = {
  id: "necrons",
  name: "Necrons",
  description: "Placeholder Necrons datasheets for development. Not real rules.",
  detachments: [
    {
      id: "nec-awakened-dynasty",
      factionId: "necrons",
      name: "Awakened Dynasty",
      rule: {
        name: "Reanimation Protocols (placeholder)",
        text: "Destroyed models may return at the start of your turn. (Placeholder.)",
      },
      enhancements: [
        {
          id: "nec-awakened-veil-of-darkness",
          name: "Veil of Darkness",
          detachmentId: "nec-awakened-dynasty",
          points: 25,
          text: "Bearer's unit can redeploy across the battlefield. (Placeholder.)",
          requiresKeywords: ["Infantry"],
        },
        {
          id: "nec-awakened-enduring-will",
          name: "Enduring Will",
          detachmentId: "nec-awakened-dynasty",
          points: 15,
          text: "Improves the bearer's reanimation. (Placeholder.)",
        },
        {
          id: "nec-awakened-nanoscarab-casket",
          name: "Nanoscarab Casket",
          detachmentId: "nec-awakened-dynasty",
          points: 20,
          text: "Bearer regains wounds each turn. (Placeholder.)",
        },
      ],
    },
    {
      id: "nec-hypercrypt",
      factionId: "necrons",
      name: "Hypercrypt Legion",
      rule: {
        name: "Dimensional Translocation (placeholder)",
        text: "Units may teleport between locations. (Placeholder.)",
      },
      enhancements: [
        {
          id: "nec-hypercrypt-dimensional-sanctum",
          name: "Dimensional Sanctum",
          detachmentId: "nec-hypercrypt",
          points: 20,
          text: "Bearer's unit can deep strike more reliably. (Placeholder.)",
        },
        {
          id: "nec-hypercrypt-phasal-subjugator",
          name: "Phasal Subjugator",
          detachmentId: "nec-hypercrypt",
          points: 15,
          text: "Improves the bearer's melee output. (Placeholder.)",
        },
      ],
    },
  ],
  datasheets: [
    {
      id: "nec-overlord",
      name: "Overlord",
      factionId: "necrons",
      role: "Character",
      isCharacter: true,
      keywords: ["Infantry", "Character", "Overlord", "Necrons"],
      models: [
        {
          name: "Overlord",
          stats: { m: '6"', t: 5, sv: "2+", w: 5, ld: "6+", oc: 1, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Tachyon arrow",
          kind: "Ranged",
          range: '72"',
          a: "1",
          skill: "2+",
          s: "16",
          ap: "-5",
          d: "D6+6",
          keywords: ["One Shot"],
        },
        {
          name: "Overlord's blade",
          kind: "Melee",
          a: "5",
          skill: "2+",
          s: "7",
          ap: "-2",
          d: "2",
        },
      ],
      abilities: [
        { name: "My Will Be Done (placeholder)", text: "Buffs a nearby unit's attacks." },
      ],
      sizes: [{ models: 1, points: 85 }],
    },
    {
      id: "nec-technomancer",
      name: "Technomancer",
      factionId: "necrons",
      role: "Character",
      isCharacter: true,
      keywords: ["Infantry", "Character", "Technomancer", "Necrons"],
      models: [
        {
          name: "Technomancer",
          stats: { m: '6"', t: 5, sv: "3+", w: 4, ld: "6+", oc: 1, invuln: "5+" },
        },
      ],
      weapons: [
        {
          name: "Staff of light",
          kind: "Ranged",
          range: '18"',
          a: "3",
          skill: "3+",
          s: "5",
          ap: "-1",
          d: "1",
        },
        {
          name: "Staff of light (melee)",
          kind: "Melee",
          a: "4",
          skill: "3+",
          s: "5",
          ap: "-1",
          d: "1",
        },
      ],
      abilities: [
        { name: "Rites of Reanimation (placeholder)", text: "Improves nearby reanimation." },
      ],
      sizes: [{ models: 1, points: 75 }],
    },
    {
      id: "nec-imotekh",
      name: "Imotekh the Stormlord",
      factionId: "necrons",
      role: "Epic Hero",
      isCharacter: true,
      isEpicHero: true,
      keywords: ["Infantry", "Character", "Epic Hero", "Overlord", "Necrons"],
      models: [
        {
          name: "Imotekh the Stormlord",
          stats: { m: '6"', t: 5, sv: "2+", w: 6, ld: "5+", oc: 1, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Gauntlet of Fire",
          kind: "Ranged",
          range: '12"',
          a: "D6",
          skill: "2+",
          s: "4",
          ap: "-1",
          d: "1",
          keywords: ["Ignores Cover", "Torrent"],
        },
        {
          name: "Staff of the Destroyer",
          kind: "Melee",
          a: "5",
          skill: "2+",
          s: "6",
          ap: "-2",
          d: "2",
        },
      ],
      abilities: [
        {
          name: "Lord of the Storm (placeholder)",
          text: "Calls down lightning on enemy units each turn.",
        },
      ],
      sizes: [{ models: 1, points: 160 }],
    },
    {
      id: "nec-necron-warriors",
      name: "Necron Warriors",
      factionId: "necrons",
      role: "Battleline",
      keywords: ["Infantry", "Battleline", "Necron Warriors", "Necrons"],
      models: [
        {
          name: "Necron Warrior",
          stats: { m: '5"', t: 4, sv: "4+", w: 1, ld: "7+", oc: 2 },
        },
      ],
      weapons: [
        {
          name: "Gauss flayer",
          kind: "Ranged",
          range: '24"',
          a: "1",
          skill: "4+",
          s: "4",
          ap: "-1",
          d: "1",
          keywords: ["Rapid Fire 1"],
        },
        {
          name: "Close combat weapon",
          kind: "Melee",
          a: "1",
          skill: "4+",
          s: "4",
          ap: "0",
          d: "1",
        },
      ],
      abilities: [{ name: "Reanimation Protocols (placeholder)", text: "Models may return." }],
      sizes: [
        { models: 10, points: 100 },
        { models: 20, points: 200 },
      ],
    },
    {
      id: "nec-immortals",
      name: "Immortals",
      factionId: "necrons",
      role: "Infantry",
      keywords: ["Infantry", "Immortals", "Necrons"],
      models: [
        {
          name: "Immortal",
          stats: { m: '5"', t: 5, sv: "3+", w: 1, ld: "7+", oc: 1 },
        },
      ],
      weapons: [
        {
          name: "Gauss blaster",
          kind: "Ranged",
          range: '24"',
          a: "2",
          skill: "3+",
          s: "5",
          ap: "-2",
          d: "1",
          keywords: ["Rapid Fire 1"],
        },
        {
          name: "Close combat weapon",
          kind: "Melee",
          a: "1",
          skill: "4+",
          s: "4",
          ap: "0",
          d: "1",
        },
      ],
      abilities: [{ name: "Reanimation Protocols (placeholder)", text: "Models may return." }],
      sizes: [
        { models: 5, points: 70 },
        { models: 10, points: 140 },
      ],
    },
    {
      id: "nec-lychguard",
      name: "Lychguard",
      factionId: "necrons",
      role: "Infantry",
      keywords: ["Infantry", "Lychguard", "Necrons"],
      models: [
        {
          name: "Lychguard",
          stats: { m: '5"', t: 6, sv: "2+", w: 2, ld: "7+", oc: 1, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Warscythe",
          kind: "Melee",
          a: "3",
          skill: "3+",
          s: "8",
          ap: "-2",
          d: "2",
        },
      ],
      abilities: [{ name: "Bodyguard (placeholder)", text: "Protects a nearby leader." }],
      sizes: [
        { models: 5, points: 95 },
        { models: 10, points: 190 },
      ],
    },
    {
      id: "nec-doomsday-ark",
      name: "Doomsday Ark",
      factionId: "necrons",
      role: "Vehicle",
      keywords: ["Vehicle", "Doomsday Ark", "Necrons"],
      models: [
        {
          name: "Doomsday Ark",
          stats: { m: '10"', t: 9, sv: "3+", w: 14, ld: "7+", oc: 3 },
        },
      ],
      weapons: [
        {
          name: "Doomsday cannon (charged)",
          kind: "Ranged",
          range: '72"',
          a: "D6+1",
          skill: "3+",
          s: "14",
          ap: "-3",
          d: "D6",
          keywords: ["Heavy"],
        },
        {
          name: "Gauss flayer arrays",
          kind: "Ranged",
          range: '24"',
          a: "10",
          skill: "4+",
          s: "4",
          ap: "-1",
          d: "1",
        },
      ],
      abilities: [{ name: "Living Metal (placeholder)", text: "Regains wounds each turn." }],
      sizes: [{ models: 1, points: 200 }],
    },
  ],
};
