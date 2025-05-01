
import MainLayout from "@/components/layout/MainLayout";
import CharacterCard from "@/components/game/CharacterCard";
import InventoryItem from "@/components/game/InventoryItem";
import { Sword, Shield, Package, Book, Scroll } from "lucide-react";

const characterStats = [
  { name: "Health", value: 250, max: 250 },
  { name: "Mana", value: 120, max: 150 },
  { name: "Strength", value: 18 },
  { name: "Dexterity", value: 14 },
  { name: "Intelligence", value: 12 },
  { name: "Constitution", value: 16 },
  { name: "Wisdom", value: 10 },
  { name: "Charisma", value: 8 }
];

const equippedItems = [
  {
    name: "Arcane Staff",
    description: "A powerful staff that channels magical energies.",
    rarity: "rare" as const,
    type: "Weapon - Staff",
    stats: {
      intelligence: 5,
      magicDamage: 15,
      manaRegen: 2
    },
    equipped: true
  },
  {
    name: "Elven Robes",
    description: "Light robes woven with enchanted elven silk.",
    rarity: "common" as const,
    type: "Armor - Cloth",
    stats: {
      defense: 8,
      magicResist: 12,
      movementSpeed: 3
    },
    equipped: true
  },
  {
    name: "Amulet of Wisdom",
    description: "Ancient amulet that enhances the wearer's magical abilities.",
    rarity: "epic" as const,
    type: "Accessory - Necklace",
    stats: {
      intelligence: 8,
      wisdom: 5,
      spellPower: 10
    },
    equipped: true
  },
  {
    name: "Boots of Swiftness",
    description: "Enchanted boots that allow the wearer to move with incredible speed.",
    rarity: "rare" as const,
    type: "Armor - Boots",
    stats: {
      movementSpeed: 15,
      dexterity: 3,
      evasion: 5
    },
    equipped: true
  }
];

const Character = () => {
  return (
    <MainLayout>
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sword className="text-fantasy-gold" size={24} />
          <h2 className="text-2xl font-medievalsharp text-white">Character Sheet</h2>
        </div>
        
        {/* Character Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <CharacterCard 
              name="Elyndra"
              level={5}
              class="Mage"
              race="Elf"
              stats={characterStats}
              imageUrl="https://images.unsplash.com/photo-1466442929976-97f336a657be"
            />
          </div>
          
          <div className="lg:col-span-2">
            <div className="fantasy-card h-full">
              <div className="flex items-center gap-2 mb-4">
                <Scroll className="text-fantasy-purple" size={18} />
                <h3 className="font-medievalsharp">Character Background</h3>
              </div>
              
              <p className="mb-4 text-muted-foreground">
                Elyndra is a talented elven mage who left her forest home to explore the wider world and 
                expand her magical knowledge. Born with an innate connection to arcane energies, she 
                specializes in elemental magic, particularly frost spells.
              </p>
              
              <p className="mb-4 text-muted-foreground">
                After studying at the prestigious Arcanum Academy, she now travels between realms, 
                searching for ancient magical artifacts and forgotten spells. Her ultimate goal is to 
                become an Archmage and establish a new school of magic that combines elven traditions 
                with modern arcane techniques.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="fantasy-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Class Features</div>
                  <div className="text-sm">Arcane Recovery, Spellcasting</div>
                </div>
                
                <div className="fantasy-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Proficiencies</div>
                  <div className="text-sm">Arcana, History, Investigation</div>
                </div>
                
                <div className="fantasy-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Languages</div>
                  <div className="text-sm">Common, Elvish, Draconic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Equipment Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-fantasy-gold" size={18} />
            <h3 className="text-xl font-medievalsharp text-white">Equipped Items</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equippedItems.map((item, index) => (
              <InventoryItem key={index} {...item} />
            ))}
          </div>
        </div>
        
        {/* Skills & Abilities */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Book className="text-fantasy-gold" size={18} />
            <h3 className="text-xl font-medievalsharp text-white">Skills & Abilities</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Frostbolt",
                description: "Launch a bolt of frost energy at an enemy, dealing ice damage and slowing movement.",
                type: "Offensive",
                cooldown: "4s",
                manaCost: 15,
                level: 3
              },
              {
                name: "Arcane Barrier",
                description: "Create a magical shield that absorbs damage and reflects a portion back to attackers.",
                type: "Defensive",
                cooldown: "20s",
                manaCost: 35,
                level: 2
              },
              {
                name: "Teleport",
                description: "Instantly teleport to a location within range, evading danger or repositioning.",
                type: "Utility",
                cooldown: "45s",
                manaCost: 50,
                level: 1
              },
              {
                name: "Arcane Intellect",
                description: "Passive ability that increases intelligence and mana regeneration rate.",
                type: "Passive",
                level: 2
              },
              {
                name: "Polymorph",
                description: "Transform an enemy into a harmless creature for a short duration, incapacitating them.",
                type: "Control",
                cooldown: "60s",
                manaCost: 80,
                level: 1
              },
              {
                name: "Blizzard",
                description: "Call down a storm of ice shards in an area, dealing continuous damage to all enemies within it.",
                type: "Area of Effect",
                cooldown: "90s",
                manaCost: 120,
                level: 0
              }
            ].map((ability, index) => (
              <div key={index} className="fantasy-card">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medievalsharp text-fantasy-purple">{ability.name}</h4>
                  <span className="text-xs bg-fantasy-dark px-2 py-0.5 rounded-full">{ability.type}</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{ability.description}</p>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  {ability.cooldown && (
                    <div className="bg-fantasy-dark/50 px-2 py-1 rounded">
                      <span className="text-muted-foreground">CD:</span> {ability.cooldown}
                    </div>
                  )}
                  
                  {ability.manaCost && (
                    <div className="bg-fantasy-dark/50 px-2 py-1 rounded">
                      <span className="text-muted-foreground">Mana:</span> {ability.manaCost}
                    </div>
                  )}
                  
                  <div className="ml-auto bg-fantasy-dark/50 px-2 py-1 rounded">
                    <span className="text-muted-foreground">Level:</span> {ability.level}
                  </div>
                </div>
                
                {ability.level < 3 && (
                  <div className="mt-2 pt-2 border-t border-fantasy-purple/20 flex justify-end">
                    <button className="fantasy-button primary text-xs py-1 px-3">Upgrade</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Character;
