import React from 'react';
import { SearchIcon, CloseIcon } from './Icons.jsx';

export const NavTabs = ({
  currentTab,
  onSelectTab,
  totalCount,
  streamingCount,
  pendingCount,
  whitelistCount,
  searchQuery,
  onSearchChange,
  isDeviceView
}) => {
  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    const viewDevices = document.getElementById('view-devices');
    const viewWhitelist = document.getElementById('view-whitelist');
    const viewPin = document.getElementById('view-pin');
    const searchBox = document.getElementById('search-box');

    if (tabId === 'all' || tabId === 'watching' || tabId === 'pending') {
      if (viewDevices) viewDevices.hidden = false;
      if (viewWhitelist) viewWhitelist.hidden = true;
      if (viewPin) viewPin.hidden = true;
      if (searchBox) searchBox.hidden = false;
    } else if (tabId === 'whitelist') {
      if (viewDevices) viewDevices.hidden = true;
      if (viewWhitelist) viewWhitelist.hidden = false;
      if (viewPin) viewPin.hidden = true;
      if (searchBox) searchBox.hidden = true;
    } else if (tabId === 'pin') {
      if (viewDevices) viewDevices.hidden = true;
      if (viewWhitelist) viewWhitelist.hidden = true;
      if (viewPin) viewPin.hidden = false;
      if (searchBox) searchBox.hidden = true;
    }
  };

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
          id="tab-whitelist"
          type="button"
          className={`tab-btn ${currentTab === 'whitelist' ? 'active' : ''}`}
          onClick={() => handleTabClick('whitelist')}
        >
          IP Whitelist ({whitelistCount})
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
          ref={(el) => {
            if (el && !el._hasInputListener) {
              el._hasInputListener = true;
              el.addEventListener('input', (e) => {
                onSearchChange(e.target ? e.target.value : el.value);
              });
            }
          }}
          type="search"
          value={searchQuery}
          onInput={(e) => onSearchChange(e.target.value || document.getElementById('search')?.value || '')}
          onChange={(e) => onSearchChange(e.target.value || document.getElementById('search')?.value || '')}
          placeholder="Search name, IP, title, ID..."
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
