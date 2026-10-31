import React from 'react';
import { SearchIcon, CloseIcon } from './Icons.jsx';

export const NavTabs = ({
  currentTab,
  onSelectTab,
  totalCount,
  streamingCount,
  pendingCount,
  approvedCount,
  searchQuery,
  onSearchChange,
  isDeviceView
}) => {
  const handleTabClick = onSelectTab;

  return (
    <div className="menu-row">
      <div className="tab-scroll">
        <button
          id="tab-all"
          type="button"
          className={`tab-btn ${currentTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabClick('all')}
        >
          All Devices ({totalCount})
        </button>

        <button
          id="tab-watching"
          type="button"
          className={`tab-btn ${currentTab === 'watching' ? 'active' : ''}`}
          onClick={() => handleTabClick('watching')}
        >
          <span className="tab-btn-watching-wrap">
            <span className="green-dot" />
            Watching ({streamingCount})
          </span>
        </button>

        <button
          id="tab-pending"
          type="button"
          className={`tab-btn ${currentTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabClick('pending')}
        >
          Pending ({pendingCount})
        </button>

        <button
          id="tab-approved"
          type="button"
          className={`tab-btn ${currentTab === 'approved' ? 'active' : ''}`}
          onClick={() => handleTabClick('approved')}
        >
          Approved ({approvedCount})
        </button>

        <button
          id="tab-pin"
          type="button"
          className={`tab-btn ${currentTab === 'pin' ? 'active' : ''}`}
          onClick={() => handleTabClick('pin')}
        >
          Security PIN
        </button>
      </div>

      <div id="search-box" className="compact-search" hidden={!isDeviceView}>
        <SearchIcon size={14} color="#777777" />
        <input
          id="search"
          type="search"
          value={searchQuery}
          onInput={(e) => onSearchChange(e.target.value || document.getElementById('search')?.value || '')}
          placeholder="Search name, title, device ID…"
          className="compact-search-input"
          aria-label="Search devices"
        />
        {searchQuery ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <CloseIcon size={12} color="#888888" />
          </button>
        ) : null}
      </div>
    </div>
  );
};
