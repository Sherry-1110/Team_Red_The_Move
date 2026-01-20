import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Move, User, Comment } from './types';
import { firestoreDocToMove, sortByNewest, createId } from './utilities/helpers';
import { signOut } from './utilities/auth';
import { useAuth } from './contexts/AuthContext';
import { ExploreScreen } from './components/ExploreScreen';
import { CreateMoveScreen } from './components/CreateMoveScreen';
import { MyMovesScreen } from './components/MyMovesScreen';
import { MoveDetailScreen } from './components/MoveDetailScreen';
import { EditMoveScreen } from './components/EditMoveScreen';
import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';

const defaultUser: User = {
  id: 'user-1',
  name: 'Alec',
};

const App = () => {
  const { user: firebaseUser, loading } = useAuth();
  const [moves, setMoves] = useState<Move[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'create' | 'profile'>('explore');
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const [editingMoveId, setEditingMoveId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Convert Firebase user to app user
  const user: User = firebaseUser
    ? {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      }
    : defaultUser;

  // Listen to Firestore moves collection in real-time
  useEffect(() => {
    const movesCollection = collection(db, 'moves');
    const unsubscribe = onSnapshot(
      movesCollection,
      (snapshot) => {
        const movesData: Move[] = [];
        snapshot.forEach((docSnapshot) => {
          const move = firestoreDocToMove(docSnapshot.data(), docSnapshot.id);
          movesData.push(move);
        });
        setMoves(movesData);
      },
      (error) => {
        console.error('Error listening to moves collection:', error);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedMove = useMemo(
    () => moves.find((move) => move.id === selectedMoveId) ?? null,
    [moves, selectedMoveId],
  );

  const joinedMoves = useMemo(() => {
    return sortByNewest(
      moves.filter(
        (move) => move.attendees.includes(user.name) && move.hostId !== user.id,
      ),
    );
  }, [moves, user.id, user.name]);

  const hostingMoves = useMemo(
    () => sortByNewest(moves.filter((move) => move.hostId === user.id)),
    [moves, user.id],
  );

  const handleJoinMove = async (moveId: string) => {
    const move = moves.find((m) => m.id === moveId);
    if (!move || move.attendees.includes(user.name)) return;
    if (move.attendees.length >= move.maxParticipants) return;

    try {
      const moveRef = doc(db, 'moves', moveId);
      await updateDoc(moveRef, {
        attendees: [...move.attendees, user.name],
      });
    } catch (error) {
      console.error('Error joining move:', error);
    }
  };

  const handleCancelMove = async (moveId: string) => {
    try {
      const moveRef = doc(db, 'moves', moveId);
      await deleteDoc(moveRef);
      setSelectedMoveId((current) => (current === moveId ? null : current));
    } catch (error) {
      console.error('Error canceling move:', error);
    }
  };

  const handleEditMove = async (
    moveId: string,
    formData: {
      title: string;
      description: string;
      location: string;
      startTime: string;
      endTime: string;
      area: string;
      activityType: string;
    },
  ) => {
    try {
      const moveRef = doc(db, 'moves', moveId);
      await updateDoc(moveRef, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        area: formData.area,
        activityType: formData.activityType,
      });
      setEditingMoveId(null);
    } catch (error) {
      console.error('Error editing move:', error);
    }
  };

  const handleCreateMove = async (formData: {
    title: string;
    description: string;
    remarks: string;
    location: string;
    startTime: string;
    endTime: string;
    maxParticipants: number;
    area: string;
    activityType: string;
  }) => {
    try {
      const movesCollection = collection(db, 'moves');
      await addDoc(movesCollection, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        remarks: formData.remarks.trim(),
        location: formData.location.trim(),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        createdAt: new Date().toISOString(),
        area: formData.area,
        activityType: formData.activityType,
        hostId: user.id,
        hostName: user.name,
        attendees: [user.name],
        maxParticipants: formData.maxParticipants,
        comments: [],
      });
      setActiveTab('explore');
    } catch (error) {
      console.error('Error creating move:', error);
    }
  };

  const handleAddComment = async (moveId: string, text: string) => {
    const move = moves.find((m) => m.id === moveId);
    if (!move) return;

    try {
      const moveRef = doc(db, 'moves', moveId);
      const nextComment: Comment = {
        id: createId(),
        author: user.name,
        text: text,
        createdAt: new Date().toISOString(),
      };
      await updateDoc(moveRef, {
        comments: [...move.comments, nextComment],
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setActiveTab('explore');
      setSelectedMoveId(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading screen while auth is being determined
  if (loading) {
    return (
      <div className="app-shell">
        <div className="screen">
          <header className="app-header">
            <div>
              <p className="eyebrow">Northwestern Student Hangouts</p>
              <h1>The Move</h1>
              <p className="tagline">A live feed for spontaneous campus plans.</p>
            </div>
          </header>
          <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>Loading...</p>
          </main>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!firebaseUser) {
    return <LoginScreen onSignIn={() => {}} />;
  }

  return (
    <div className="app-shell">
      <div className="screen">
        {activeTab === 'explore' && (
          <header className="app-header">
            <div>
              <p className="eyebrow">Northwestern Student Hangouts</p>
              <h1>The Move</h1>
              <p className="tagline">A live feed for spontaneous campus plans.</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={handleSignOut}
              style={{ position: 'absolute', top: '20px', right: '20px' }}
            >
              Sign Out
            </button>
          </header>
        )}

        <main className="app-main">
          {activeTab === 'explore' && (
            <ExploreScreen
              moves={moves}
              now={now}
              userName={user.name}
              onJoinMove={handleJoinMove}
              onSelectMove={setSelectedMoveId}
            />
          )}

          {activeTab === 'create' && (
            <CreateMoveScreen onCreateMove={handleCreateMove} />
          )}

          {activeTab === 'profile' && (
            <MyMovesScreen
              joinedMoves={joinedMoves}
              hostingMoves={hostingMoves}
              now={now}
              onCancelMove={handleCancelMove}
              onSelectMove={setSelectedMoveId}
              onEditMove={setEditingMoveId}
            />
          )}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedMove && (
        <MoveDetailScreen
          move={selectedMove}
          now={now}
          userId={user.id}
          userName={user.name}
          onJoinMove={handleJoinMove}
          onCancelMove={handleCancelMove}
          onAddComment={handleAddComment}
          onClose={() => setSelectedMoveId(null)}
        />
      )}

      {editingMoveId && (
        <EditMoveScreen
          move={moves.find((m) => m.id === editingMoveId)!}
          onEditMove={handleEditMove}
          onClose={() => setEditingMoveId(null)}
        />
      )}
    </div>
  );
};

export default App;
