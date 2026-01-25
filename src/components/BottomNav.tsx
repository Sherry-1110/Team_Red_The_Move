type BottomNavProps = {
  activeTab: 'explore' | 'create';
  onTabChange: (tab: 'explore' | 'create') => void;
};

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <button
        className={`nav-item ${activeTab === 'create' ? 'nav-item--active' : ''}`}
        type="button"
        aria-label="Create"
        onClick={() => onTabChange('create')}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Create</span>
      </button>
    </nav>
  );
};
