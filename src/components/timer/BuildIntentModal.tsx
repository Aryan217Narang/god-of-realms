import React, { useState, useEffect } from 'react';
import type { AppState, SubjectId } from '../../types';
import { REALMS_CONFIG, REALM_BUILD_PROJECTS, type BuildProject } from '../../utils/gameLogic';
import { Button } from '../ui';
import { Hammer, Sparkles, X, Clock, Check } from 'lucide-react';

interface BuildIntentModalProps {
  isOpen: boolean;
  subjectId: SubjectId | null;
  state: AppState;
  onClose: () => void;
  onConfirm: (subjectId: SubjectId, buildTarget: string) => void;
}

export const BuildIntentModal: React.FC<BuildIntentModalProps> = ({
  isOpen,
  subjectId,
  state,
  onClose,
  onConfirm,
}) => {
  const activeSubjectId = subjectId || 'daa';
  const projects = REALM_BUILD_PROJECTS[activeSubjectId] || [];
  const subject = state.subjects[activeSubjectId];
  const config = REALMS_CONFIG[activeSubjectId];

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Initialize selected project whenever subject changes
  useEffect(() => {
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      setIsCustom(false);
      setCustomGoal('');
    }
  }, [activeSubjectId, projects.length]);

  if (!isOpen) return null;

  const handleSelectProject = (project: BuildProject) => {
    setSelectedProjectId(project.id);
    setIsCustom(false);
  };

  const handleStartSession = () => {
    let chosenTarget = '';
    if (isCustom && customGoal.trim()) {
      chosenTarget = customGoal.trim();
    } else {
      const proj = projects.find(p => p.id === selectedProjectId);
      chosenTarget = proj ? proj.name : projects[0]?.name || 'Realm Restoration';
    }

    onConfirm(activeSubjectId, chosenTarget);
  };

  const studyMinutes = state.settings.studyDurationMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border-2 border-pink-400 rounded-xl shadow-[0_0_35px_rgba(236,72,153,0.3)] overflow-hidden animate-pixel-in text-slate-900">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-lg bg-white border border-pink-300 shadow-sm">
              {activeSubjectId === 'daa' ? '🌲' :
               activeSubjectId === 'os' ? '⛰️' :
               activeSubjectId === 'nosql' ? '🏛️' :
               activeSubjectId === 'hda_cognitive' ? '🧠' : '🏝️'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-pink-700 pixel-font tracking-wide">
                  {config.title}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-100 text-pink-700 font-pixel font-bold uppercase">
                  Lv.{subject?.level || 1}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-pixel mt-0.5">
                {config.realmType} • Focus Project Selection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Prompt Banner */}
          <div className="p-3.5 rounded-lg bg-pink-50/80 border border-pink-200 flex items-center gap-3">
            <div className="p-2 rounded-md bg-pink-500 text-white">
              <Hammer className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 pixel-font">
                What will you construct in this study session?
              </div>
              <div className="text-xs text-slate-600 font-pixel mt-0.5">
                Select a concrete world-building project. Completing your timer will add it directly to your realm!
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map(p => {
              const isSelected = !isCustom && selectedProjectId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProject(p)}
                  className={`relative p-3.5 rounded-lg text-left transition-all cursor-pointer border-2 ${
                    isSelected
                      ? 'bg-pink-50 border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.25)]'
                      : 'bg-white border-pink-200 hover:border-pink-300 hover:bg-pink-50/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl select-none">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold pixel-font truncate ${isSelected ? 'text-pink-800' : 'text-slate-900'}`}>
                          {p.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-pink-600 font-pixel font-bold mt-0.5">
                        {p.category}
                      </div>
                      <p className="text-[11px] text-slate-500 font-pixel mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Project Write-In */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                isCustom
                  ? 'bg-pink-50 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.25)]'
                  : 'bg-white border-pink-200 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 pixel-font flex items-center gap-2">
                  <span>✨</span> Custom Focus Intent or Project
                </span>
                {isCustom && (
                  <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. Carve trail switchbacks to the summit camp..."
                value={customGoal}
                onFocus={() => setIsCustom(true)}
                onChange={e => {
                  setCustomGoal(e.target.value);
                  setIsCustom(true);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded text-slate-800 placeholder-slate-400 font-pixel focus:outline-none focus:border-pink-500"
              />
            </button>
          </div>

          {/* Session Summary Details */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-pixel pt-1 border-t border-pink-100">
            <div className="flex items-center gap-1.5 text-pink-700 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Target Duration: <strong>{studyMinutes} min</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-pink-600 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reward: <strong>+{studyMinutes + 25} XP</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-pink-50/60 border-t border-pink-200 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-600 hover:text-pink-700">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleStartSession}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold pixel-font shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer border-pink-600"
          >
            <Hammer className="w-4 h-4" />
            Begin Construction & Start ({studyMinutes}m)
          </Button>
        </div>

      </div>
    </div>
  );
};
