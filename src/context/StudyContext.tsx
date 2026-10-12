import React, { createContext, useContext, useState, useEffect } from 'react';
import { LearnerProgress } from '../types';
import { useAuth } from './AuthContext';

interface StudyContextType {
  progressMap: Record<string, LearnerProgress>;
  markCompleted: (nodeId: string, score?: number) => void;
  isCompleted: (nodeId: string) => boolean;
  toggleBookmark: (nodeId: string) => void;
  isBookmarked: (nodeId: string) => boolean;
  getNotes: (nodeId: string) => string;
  saveNotes: (nodeId: string, notes: string) => void;
  userXp: number;
  streakDays: number;
  addXp: (amount: number) => void;
  completedCount: number;
  completedSimulationChallenges: string[];
  markChallengeSolved: (challengeId: string) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || 'guest';
  const storageKey = `veyra_study_${currentUserId}`;

  const [progressMap, setProgressMap] = useState<Record<string, LearnerProgress>>(() => {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem(`edunova_study_${currentUserId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [userXp, setUserXp] = useState<number>(currentUser?.xp || 350);
  const [streakDays, setStreakDays] = useState<number>(currentUser?.streakDays || 5);
  const [completedSimulationChallenges, setCompletedSimulationChallenges] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`veyra_study_${currentUserId}`) || localStorage.getItem(`edunova_study_${currentUserId}`);
    if (saved) {
      setProgressMap(JSON.parse(saved));
    } else {
      setProgressMap({});
    }
    setUserXp(currentUser?.xp || 350);
    setStreakDays(currentUser?.streakDays || 5);
  }, [currentUserId, currentUser?.xp, currentUser?.streakDays]);

  useEffect(() => {
    localStorage.setItem(`veyra_study_${currentUserId}`, JSON.stringify(progressMap));
  }, [progressMap, currentUserId]);

  const markCompleted = (nodeId: string, score?: number) => {
    setProgressMap(prev => ({
      ...prev,
      [nodeId]: {
        nodeId,
        completed: true,
        score: score !== undefined ? score : prev[nodeId]?.score,
        lastVisited: new Date().toISOString(),
        notes: prev[nodeId]?.notes || '',
        bookmarked: prev[nodeId]?.bookmarked || false,
      }
    }));
    addXp(50);
  };

  const isCompleted = (nodeId: string): boolean => {
    return !!progressMap[nodeId]?.completed;
  };

  const toggleBookmark = (nodeId: string) => {
    setProgressMap(prev => {
      const existing = prev[nodeId] || {
        nodeId,
        completed: false,
        lastVisited: new Date().toISOString(),
      };
      return {
        ...prev,
        [nodeId]: {
          ...existing,
          bookmarked: !existing.bookmarked
        }
      };
    });
  };

  const isBookmarked = (nodeId: string): boolean => {
    return !!progressMap[nodeId]?.bookmarked;
  };

  const getNotes = (nodeId: string): string => {
    return progressMap[nodeId]?.notes || '';
  };

  const saveNotes = (nodeId: string, notes: string) => {
    setProgressMap(prev => {
      const existing = prev[nodeId] || {
        nodeId,
        completed: false,
        lastVisited: new Date().toISOString(),
      };
      return {
        ...prev,
        [nodeId]: {
          ...existing,
          notes,
          lastVisited: new Date().toISOString()
        }
      };
    });
  };

  const addXp = (amount: number) => {
    setUserXp(prev => prev + amount);
  };

  const markChallengeSolved = (challengeId: string) => {
    if (!completedSimulationChallenges.includes(challengeId)) {
      setCompletedSimulationChallenges(prev => [...prev, challengeId]);
      addXp(75);
    }
  };

  const completedCount = Object.values(progressMap).filter(p => p.completed).length;

  return (
    <StudyContext.Provider
      value={{
        progressMap,
        markCompleted,
        isCompleted,
        toggleBookmark,
        isBookmarked,
        getNotes,
        saveNotes,
        userXp,
        streakDays,
        addXp,
        completedCount,
        completedSimulationChallenges,
        markChallengeSolved,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within StudyProvider');
  return context;
};
