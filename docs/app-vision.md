# App Vision: The Move (Backend Upgrade)

**Context:**
We are upgrading the existing "The Move" app from using local mock data to using **Firebase Firestore** as the real backend.

**Tech Stack:**
- React (Vite)
- Firebase SDK

**Credentials (Use these to initialize app):**
const firebaseConfig = {
    apiKey: "AIzaSyARVoyxlPtP5ls5N6oSndCFLNQb89gkQ_g",
  authDomain: "teamred-themove.firebaseapp.com",
  projectId: "teamred-themove",
  storageBucket: "teamred-themove.firebasestorage.app",
  messagingSenderId: "457325441176",
  appId: "1:457325441176:web:cafffe17a364ab28aa60ed"
};

**Task Requirements:**

1.  **Initialize Firebase:**
    - Create a new file `src/firebase.js`.
    - Initialize the app using the config above.
    - Export `db` (the Firestore instance).

2.  **Refactor Data Logic (App.jsx / Context):**
    - **Read:** Replace the `useState` mock data array with a `useEffect` hook that listens to the `moves` collection in real-time (`onSnapshot`).
    - **Create:** Update the "Post" function to use `addDoc` to save new events to Firestore.
    - **Delete:** Update the "Delete" function to use `deleteDoc`.
    - **Join/Unjoin:** Update the join logic to modify the specific document in Firestore (`updateDoc`).

3.  **UI Preservation:**
    - **CRITICAL:** Do NOT change any UI styles, layout, or CSS. Only change the JavaScript logic responsible for data fetching.
    
    
    # Name

- The app is called The Move.

# Users

- Users are Northwestern students who want to find spontaneous hangouts or host them.

# Value proposition

A real-time social feed to discover campus activities and join with one tap to avoid the noise of group chats.

# Key features

Simple mobile-friendly design with a bottom navigation bar for Explore, Create, and My Moves tabs:
  - A scrollable Explore feed of cards with the newest items first.
  - Filter chips at the top for campus areas such as North, South, Downtown, and Other, and a second set of filter chips for activity type such as Food, Study, Sports, Social, and Other.
  - A search bar to filter moves by keyword.
  - Move cards showing title, descriptåion, location, start time, end time, activity type, participant count, and a Join button.
  - Move cards display a status badge saying Live Now if the event has started, Upcoming if it is scheduled for later, or Past if the it has ended.

Simple operations:
  - Tap a card to open the Move Detail page full screen.
  - Tap Join to RSVP which reveals the hidden attendee list on the Detail page.
  - Tap Post in the Create tab to publish a move with title, description, location, activity type, start time, and end time.
  - Tap Cancel on a move you created to remove it from the feed.
  - Tap Leave on a move you joined to remove your RSVP.

Data management:
  - The My Moves tab has two sub-tabs called Joined for moves you RSVPed to and Hosting for moves you posted.
  - Comments section at the bottom of the Move Detail page for coordination.

# Example scenario

Here is an example session:
- Alec is a sophomore looking for something to do.
- Alec opens the app to the Explore feed and sees the header Open Events.
- He taps the North Campus filter chip to see relevant moves.
- He sees a Frisbee move labeled Live Now and taps the card.
- The Detail page opens and he sees the description but the attendee list is hidden.
- Alec taps Join and the button says Joined and the attendee list becomes visible.
- Later Alec goes to the My Moves tab, clicks Hosting, and cancels a study session labeled Upcoming he posted earlier.

# Coding notes

- Use localStorage to store the list of moves and the user RSVPs and comments.
- Use a simple User object in state to track which moves belong to the user.
- Use Northwestern Purple (#4E2A84) as the primary color.
- Use setInterval() to update time ago labels and to toggle the status badge between Live Now and Upcoming based on the current time.
- Use the current time to compute status as Upcoming before start time, Live Now between start time and end time, and Past after end time.

# Testing notes
- Define unit tests for the Join button to ensure it increments count and reveals attendees.
- Define unit tests for the North Campus filter to ensure it hides South Campus moves.
- Define unit tests for the My Moves tabs to ensure it correctly separates Joined moves and Hosting moves.
- Define unit tests to verify that moves with past start times show Live Now and future start times show Upcoming.