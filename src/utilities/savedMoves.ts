// Utilities for managing saved moves with localStorage

const getSavedMovesKey = (userId: string) => `savedMoves_${userId}`;

export const getSavedMoveIdsAsync = async (userId: string): Promise<string[]> => {
  try {
    const stored = localStorage.getItem(getSavedMovesKey(userId));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error fetching saved moves from localStorage:', error);
    return [];
  }
};

export const saveMoveIdAsync = async (userId: string, moveId: string): Promise<void> => {
  try {
    const savedMoves = await getSavedMoveIdsAsync(userId);
    if (!savedMoves.includes(moveId)) {
      savedMoves.push(moveId);
      localStorage.setItem(getSavedMovesKey(userId), JSON.stringify(savedMoves));
    }
  } catch (error) {
    console.error('Error saving move to localStorage:', error);
  }
};

export const unsaveMoveIdAsync = async (userId: string, moveId: string): Promise<void> => {
  try {
    const savedMoves = await getSavedMoveIdsAsync(userId);
    const filtered = savedMoves.filter((id) => id !== moveId);
    localStorage.setItem(getSavedMovesKey(userId), JSON.stringify(filtered));
  } catch (error) {
    console.error('Error unsaving move from localStorage:', error);
  }
};

export const toggleSaveMoveIdAsync = async (
  userId: string,
  moveId: string,
  currentlySaved: boolean,
): Promise<boolean> => {
  if (currentlySaved) {
    await unsaveMoveIdAsync(userId, moveId);
    return false;
  } else {
    await saveMoveIdAsync(userId, moveId);
    return true;
  }
};

export const isMoveSavedAsync = async (userId: string, moveId: string): Promise<boolean> => {
  try {
    const savedMoves = await getSavedMoveIdsAsync(userId);
    return savedMoves.includes(moveId);
  } catch (error) {
    console.error('Error checking saved move status:', error);
    return false;
  }
};
