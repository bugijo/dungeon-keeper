
import { Routes, Route } from 'react-router-dom';
import CharacterCreation from './CharacterCreation';
import StoryCreation from './StoryCreation';
import MapCreation from './MapCreation';
import ItemCreation from './ItemCreation';
import MonsterCreation from './MonsterCreation';
import NpcCreation from './NpcCreation';

export const CreationRouter = () => {
  return (
    <Routes>
      <Route path="/characters" element={<CharacterCreation />} />
      <Route path="/characters/:id" element={<CharacterCreation />} />
      
      <Route path="/stories" element={<StoryCreation />} />
      <Route path="/stories/:id" element={<StoryCreation />} />
      
      <Route path="/maps" element={<MapCreation />} />
      <Route path="/maps/:id" element={<MapCreation />} />
      
      <Route path="/items" element={<ItemCreation />} />
      <Route path="/items/:id" element={<ItemCreation />} />
      
      <Route path="/monsters" element={<MonsterCreation />} />
      <Route path="/monsters/:id" element={<MonsterCreation />} />
      
      <Route path="/npcs" element={<NpcCreation />} />
      <Route path="/npcs/:id" element={<NpcCreation />} />
    </Routes>
  );
};

export default CreationRouter;
