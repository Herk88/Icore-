
import React from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Terminal, Activity, Move, MousePointer2, Keyboard as KbIcon } from 'lucide-react';

interface VirtualOutputProps {
  profile: Profile;
}

const VirtualOutput: React.FC<VirtualOutputProps> = ({ profile }) => {
  const { state } = useGamepad();

  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const isKeyPressed = (k: string) => {
    const code = `Key${k}`;
    return state.virtualKeys.has(code) || state.virtualKeys.has(k);
  };

  // Visual graphics removed from interface menu as requested
  return null;
};

export default VirtualOutput;
