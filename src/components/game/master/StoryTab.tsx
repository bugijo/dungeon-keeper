
import React from 'react';

export interface StoryTabProps {
  sessionId?: string;
  currentStorySegment?: number;
  storySegments?: { id: number; text: string; notes: string; }[];
  setCurrentStorySegment?: React.Dispatch<React.SetStateAction<number>>;
  addStorySegment?: () => void;
}

const StoryTab: React.FC<StoryTabProps> = ({
  sessionId,
  currentStorySegment,
  storySegments,
  setCurrentStorySegment,
  addStorySegment
}) => {
  return (
    <div>
      <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-4">História</h3>
      <p className="text-fantasy-stone">Compartilhe a narrativa da sua aventura.</p>
      {sessionId && <p className="text-xs text-fantasy-stone/70 mt-2">ID da sessão: {sessionId}</p>}
    </div>
  );
};

export default StoryTab;
