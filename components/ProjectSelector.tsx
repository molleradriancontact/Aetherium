
import React from 'react';
import { ProjectType } from '../types';
import { ResearchIcon, GameIcon, CustomIcon } from './icons/CategoryIcons';

interface ProjectSelectorProps {
  selectedType: ProjectType | null;
  onSelect: (type: ProjectType) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ selectedType, onSelect }) => {
  const options = [
    {
      type: ProjectType.Research,
      title: 'Academic Research',
      description: 'For structuring thesis, papers, and scientific studies.',
      icon: <ResearchIcon />,
    },
    {
      type: ProjectType.Game,
      title: 'Game Development',
      description: 'For organizing game assets, scripts, and documentation.',
      icon: <GameIcon />,
    },
     {
      type: ProjectType.Custom,
      title: 'Start From Scratch',
      description: 'A blank slate for building your own custom structure.',
      icon: <CustomIcon />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map((option) => (
        <button
          key={option.type}
          onClick={() => onSelect(option.type)}
          className={`p-6 rounded-lg text-left transition-all duration-200 transform hover:-translate-y-1 ${
            selectedType === option.type
              ? 'bg-sky-600 ring-2 ring-sky-400 shadow-lg'
              : 'bg-slate-700/50 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${ selectedType === option.type ? 'bg-sky-500' : 'bg-slate-600'}`}>
              {option.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{option.title}</h3>
              <p className={`text-sm ${ selectedType === option.type ? 'text-sky-100' : 'text-slate-400'}`}>
                {option.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProjectSelector;