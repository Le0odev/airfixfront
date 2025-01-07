import React from 'react';
import { User, Briefcase } from 'lucide-react';
import { TabType } from '../types';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-1.5">
      <div className="grid grid-cols-2 gap-1">
        {(['prestadores', 'clientes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              transition-all duration-200 text-sm font-medium
              ${activeTab === tab 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {tab === 'prestadores' ? (
              <>
                <Briefcase className="h-4 w-4" />
                Prestadores
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                Clientes
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
