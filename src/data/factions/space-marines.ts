// PLACEHOLDER DATA — not real game rules.
// Values are invented for development of the list builder. Replace with
// official Warhammer 40,000 11th edition data when it is released.

import type { Faction } from "@/data/types";

export const spaceMarines: Faction = {
  id: "space-marines",
  name: "Space Marines",
  description:
    "Placeholder Adeptus Astartes datasheets for development. Not real rules.",
  detachments: [
    {
      id: "sm-gladius",
      factionId: "space-marines",
      name: "Gladius Task Force",
      rule: {
        name: "Combat Doctrines (placeholder)",
        text: "Once per round, units gain a doctrine bonus. (Placeholder text.)",
      },
      enhancements: [
        {
          id: "sm-gladius-artificer-armour",
          name: "Artificer Armour",
          detachmentId: "sm-gladius",
          points: 15,
          text: "Bearer has a 2+ save. (Placeholder.)",
        },
        {
          id: "sm-gladius-the-honour-vehement",
          name: "The Honour Vehement",
          detachmentId: "sm-gladius",
          points: 25,
          text: "Bearer's melee attacks improve. (Placeholder.)",
        },
        {
          id: "sm-gladius-fire-discipline",
          name: "Fire Discipline",
          detachmentId: "sm-gladius",
          points: 20,
          text: "Bearer's unit improves ranged accuracy. (Placeholder.)",
          requiresKeywords: ["Infantry"],
        },
      ],
    },
    {
      id: "sm-anvil",
      factionId: "space-marines",
      name: "Anvil Siege Force",
      rule: {
        name: "Hold the Line (placeholder)",
        text: "Stationary units gain defensive bonuses. (Placeholder text.)",
      },
      enhancements: [
        {
          id: "sm-anvil-adept-of-the-codex",
          name: "Adept of the Codex",
          detachmentId: "sm-anvil",
          points: 20,
          text: "Grants an extra command point use. (Placeholder.)",
        },
        {
          id: "sm-anvil-stoic-defender",
          name: "Stoic Defender",
          detachmentId: "sm-anvil",
          points: 15,
          text: "Bearer's unit is harder to shift from objectives. (Placeholder.)",
        },
      ],
    },
  ],
  datasheets: [
    {
      id: "sm-captain",
      name: "Captain",
      factionId: "space-marines",
      role: "Character",
      isCharacter: true,
      keywords: ["Infantry", "Character", "Captain", "Imperium", "Adeptus Astartes"],
      models: [
        {
          name: "Captain",
          stats: { m: '6"', t: 4, sv: "3+", w: 5, ld: "6+", oc: 1, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Master-crafted power weapon",
          kind: "Melee",
          a: "6",
          skill: "2+",
          s: "5",
          ap: "-2",
          d: "2",
          keywords: ["Precision"],
        },
        {
          name: "Bolt pistol",
          kind: "Ranged",
          range: '12"',
          a: "1",
          skill: "2+",
          s: "4",
          ap: "0",
          d: "1",
          keywords: ["Pistol"],
        },
      ],
      abilities: [
        {
          name: "Leader",
          text: "Can join a Battleline unit. (Placeholder.)",
        },
      ],
      sizes: [{ models: 1, points: 80 }],
    },
    {
      id: "sm-lieutenant",
      name: "Lieutenant",
      factionId: "space-marines",
      role: "Character",
      isCharacter: true,
      keywords: ["Infantry", "Character", "Lieutenant", "Imperium", "Adeptus Astartes"],
      models: [
        {
          name: "Lieutenant",
          stats: { m: '6"', t: 4, sv: "3+", w: 4, ld: "6+", oc: 1, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Power fist",
          kind: "Melee",
          a: "4",
          skill: "3+",
          s: "8",
          ap: "-2",
          d: "2",
        },
        {
          name: "Plasma pistol – supercharge",
          kind: "Ranged",
          range: '12"',
          a: "1",
          skill: "2+",
          s: "8",
          ap: "-3",
          d: "2",
          keywords: ["Pistol", "Hazardous"],
        },
      ],
      abilities: [{ name: "Leader", text: "Can join a Battleline unit. (Placeholder.)" }],
      sizes: [{ models: 1, points: 70 }],
    },
    {
      id: "sm-marneus-calgar",
      name: "Marneus Calgar",
      factionId: "space-marines",
      role: "Epic Hero",
      isCharacter: true,
      isEpicHero: true,
      keywords: ["Infantry", "Character", "Epic Hero", "Imperium", "Adeptus Astartes"],
      models: [
        {
          name: "Marneus Calgar",
          stats: { m: '6"', t: 6, sv: "2+", w: 6, ld: "5+", oc: 2, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Gauntlets of Ultramar (shooting)",
          kind: "Ranged",
          range: '24"',
          a: "3",
          skill: "2+",
          s: "4",
          ap: "-1",
          d: "1",
          keywords: ["Rapid Fire 3"],
        },
        {
          name: "Gauntlets of Ultramar (melee)",
          kind: "Melee",
          a: "6",
          skill: "2+",
          s: "8",
          ap: "-2",
          d: "3",
        },
      ],
      abilities: [
        {
          name: "Lord Macragge",
          text: "Once per battle, the army gains additional command resources. (Placeholder.)",
        },
      ],
      sizes: [{ models: 1, points: 185 }],
    },
    {
      id: "sm-intercessor-squad",
      name: "Intercessor Squad",
      factionId: "space-marines",
      role: "Battleline",
      keywords: ["Infantry", "Battleline", "Intercessor Squad", "Imperium", "Adeptus Astartes"],
      models: [
        {
          name: "Intercessor",
          stats: { m: '6"', t: 4, sv: "3+", w: 2, ld: "6+", oc: 2 },
        },
      ],
      weapons: [
        {
          name: "Bolt rifle",
          kind: "Ranged",
          range: '24"',
          a: "2",
          skill: "3+",
          s: "4",
          ap: "-1",
          d: "1",
          keywords: ["Assault", "Heavy"],
        },
        {
          name: "Close combat weapon",
          kind: "Melee",
          a: "3",
          skill: "3+",
          s: "4",
          ap: "0",
          d: "1",
        },
      ],
      abilities: [
        { name: "Objective Secured (placeholder)", text: "Strong on objectives." },
      ],
      sizes: [
        { models: 5, points: 80 },
        { models: 10, points: 160 },
      ],
    },
    {
      id: "sm-assault-intercessor-squad",
      name: "Assault Intercessor Squad",
      factionId: "space-marines",
      role: "Battleline",
      keywords: [
        "Infantry",
        "Battleline",
        "Assault Intercessor Squad",
        "Imperium",
        "Adeptus Astartes",
      ],
      models: [
        {
          name: "Assault Intercessor",
          stats: { m: '6"', t: 4, sv: "3+", w: 2, ld: "6+", oc: 2 },
        },
      ],
      weapons: [
        {
          name: "Heavy bolt pistol",
          kind: "Ranged",
          range: '18"',
          a: "1",
          skill: "3+",
          s: "4",
          ap: "-1",
          d: "1",
          keywords: ["Pistol"],
        },
        {
          name: "Astartes chainsword",
          kind: "Melee",
          a: "4",
          skill: "3+",
          s: "4",
          ap: "-1",
          d: "1",
        },
      ],
      abilities: [{ name: "Shock Assault (placeholder)", text: "Bonus on the charge." }],
      sizes: [
        { models: 5, points: 75 },
        { models: 10, points: 150 },
      ],
    },
    {
      id: "sm-terminator-squad",
      name: "Terminator Squad",
      factionId: "space-marines",
      role: "Infantry",
      keywords: ["Infantry", "Terminator Squad", "Imperium", "Adeptus Astartes"],
      models: [
        {
          name: "Terminator",
          stats: { m: '5"', t: 5, sv: "2+", w: 3, ld: "6+", oc: 1, invuln: "4+" },
        },
      ],
      weapons: [
        {
          name: "Storm bolter",
          kind: "Ranged",
          range: '24"',
          a: "2",
          skill: "3+",
          s: "4",
          ap: "0",
          d: "1",
          keywords: ["Rapid Fire 2"],
        },
        {
          name: "Power fist",
          kind: "Melee",
          a: "3",
          skill: "3+",
          s: "8",
          ap: "-2",
          d: "2",
        },
      ],
      abilities: [{ name: "Teleport Strike (placeholder)", text: "May arrive from reserves." }],
      sizes: [
        { models: 5, points: 170 },
        { models: 10, points: 340 },
      ],
    },
    {
      id: "sm-redemptor-dreadnought",
      name: "Redemptor Dreadnought",
      factionId: "space-marines",
      role: "Vehicle",
      keywords: ["Vehicle", "Walker", "Redemptor Dreadnought", "Imperium", "Adeptus Astartes"],
      models: [
        {
          name: "Redemptor Dreadnought",
          stats: { m: '8"', t: 10, sv: "2+", w: 12, ld: "6+", oc: 4 },
        },
      ],
      weapons: [
        {
          name: "Macro plasma incinerator – supercharge",
          kind: "Ranged",
          range: '36"',
          a: "D6+1",
          skill: "3+",
          s: "9",
          ap: "-4",
          d: "3",
          keywords: ["Hazardous"],
        },
        {
          name: "Redemptor fist",
          kind: "Melee",
          a: "5",
          skill: "3+",
          s: "12",
          ap: "-2",
          d: "3",
        },
      ],
      abilities: [{ name: "Duty Eternal (placeholder)", text: "Reduces incoming damage." }],
      sizes: [{ models: 1, points: 210 }],
    },
  ],
};
