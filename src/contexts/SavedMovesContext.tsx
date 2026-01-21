import { createContext, useContext, useState, useCallback, useEffect, type PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';
import { getSavedMoveIdsAsync, saveMoveIdAsync, unsaveMoveIdAsync, toggleSaveMoveIdAsync } from '../utilities/savedMoves';

type SavedMovesContextType = {
  savedMoveIds: string[];
  isSaved: (moveId: string) => boolean;
  toggleSave: (moveId: string) => void;
  saveMove: (moveId: string) => void;
  unsaveMove: (moveId: string) => void;
};

const SavedMovesContext = createContext<SavedMovesContextType | undefined>(undefined);

type SavedMovesProviderProps = PropsWithChildren;

export const SavedMovesProvider = ({ children }: SavedMovesProviderProps) => {
  const { user: firebaseUser } = useAuth();
  const [savedMoveIds, setSavedMoveIds] = useState<string[]>([]);

  // Load saved moves from localStorage on mount or when user changes
  useEffect(() => {
    if (!firebaseUser) {
      console.log('No user, clearing saved moves');
      setSavedMoveIds([]);
      return;
    }

    const loadSavedMoves = async () => {
      console.log(`Loading saved moves for user ${firebaseUser.uid}`);
      const ids = await getSavedMoveIdsAsync(firebaseUser.uid);
      console.log(`Loaded saved moves:`, ids);
      setSavedMoveIds(ids);
    };

    void loadSavedMoves();
  }, [firebaseUser]);

  const isSaved = useCallback(
    (moveId: string) => savedMoveIds.includes(moveId),
    [savedMoveIds],
  );

  const toggleSave = useCallback(
    async (moveId: string) => {
      if (!firebaseUser) {
        console.warn('No user logged in, cannot toggle save');
        return;
      }
      try {
        const isSavedNow = savedMoveIds.includes(moveId);
        console.log(`Toggling save for move ${moveId}, currently saved:`, isSavedNow);
        
        // Update state optimistically
        if (isSavedNow) {
          setSavedMoveIds((prev) => prev.filter((id) => id !== moveId));
        } else {
          setSavedMoveIds((prev) => [...prev, moveId]);
        }
        
        // Then update localStorage
        await toggleSaveMoveIdAsync(firebaseUser.uid, moveId, isSavedNow);
        console.log(`Successfully toggled save for move ${moveId}`);
      } catch (error) {
        console.error(`Error toggling save for move ${moveId}:`, error);
        // Reload from localStorage in case of error
        const ids = await getSavedMoveIdsAsync(firebaseUser.uid);
        setSavedMoveIds(ids);
      }
    },
    [firebaseUser, savedMoveIds],
  );

  const saveMove = useCallback(
    async (moveId: string) => {
      if (!firebaseUser) {
        console.warn('No user logged in, cannot save move');
        return;
      }
      try {
        if (!savedMoveIds.includes(moveId)) {
          console.log(`Saving move ${moveId}`);
          // Update state optimistically
          setSavedMoveIds((prev) => [...prev, moveId]);
          // Then update localStorage
          await saveMoveIdAsync(firebaseUser.uid, moveId);
          console.log(`Successfully saved move ${moveId}`);
        }
      } catch (error) {
        console.error(`Error saving move ${moveId}:`, error);
        // Reload from localStorage in case of error
        const ids = await getSavedMoveIdsAsync(firebaseUser.uid);
        setSavedMoveIds(ids);
      }
    },
    [firebaseUser, savedMoveIds],
  );

  const unsaveMove = useCallback(
    async (moveId: string) => {
      if (!firebaseUser) {
        console.warn('No user logged in, cannot unsave move');
        return;
      }
      try {
        console.log(`Unsaving move ${moveId}`);
        // Update state optimistically
        setSavedMoveIds((prev) => prev.filter((id) => id !== moveId));
        // Then update localStorage
        await unsaveMoveIdAsync(firebaseUser.uid, moveId);
        console.log(`Successfully unsaved move ${moveId}`);
      } catch (error) {
        console.error(`Error unsaving move ${moveId}:`, error);
        // Reload from localStorage in case of error
        const ids = await getSavedMoveIdsAsync(firebaseUser.uid);
        setSavedMoveIds(ids);
      }
    },
    [firebaseUser],
  );

  const value: SavedMovesContextType = {
    savedMoveIds,
    isSaved,
    toggleSave,
    saveMove,
    unsaveMove,
  };

  return (
    <SavedMovesContext.Provider value={value}>
      {children}
    </SavedMovesContext.Provider>
  );
};

export const useSavedMoves = (): SavedMovesContextType => {
  const context = useContext(SavedMovesContext);
  if (context === undefined) {
    throw new Error('useSavedMoves must be used within a SavedMovesProvider');
  }
  return context;
};
