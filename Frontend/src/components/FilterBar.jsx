import { useState } from "react";
import { activityOptions, comfortLevelOptions, destinationOptions, tourTypeOptions } from "../utils/travelOptions";

export default function FilterBar({ activeCount = 0, filters, onChange, onReset }) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  function submitFilters(event) {
    event.preventDefault();
    onChange({ ...filters });
  }

  return (
    <form className="filter-bar premium-filter-bar" onSubmit={submitFilters}>
      <div className="filter-section-label">
        <span>Search</span>
        <strong>{activeCount ? `${activeCount} active` : "Start broad"}</strong>
      </div>

      <div className="filter-primary-row">
        <label className="field wide">
          <span>Destination search</span>
          <input
            type="search"
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Country, city, safari, coast or route"
          />
        </label>
        <label className="field">
          <span>Destination</span>
          <input
            list="tour-destination-options"
            value={filters.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Any Africa destination"
          />
          <datalist id="tour-destination-options">
            {destinationOptions.map((destination) => (
              <option key={destination} value={destination} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>Activity</span>
          <select value={filters.category} onChange={(event) => update("category", event.target.value)}>
            <option value="">All activities</option>
            {activityOptions.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Travel date</span>
          <input
            type="date"
            value={filters.travelDate}
            onChange={(event) => update("travelDate", event.target.value)}
          />
        </label>
        <button className="button primary filter-search-button" type="submit">
          Search tours
        </button>
      </div>

      <div className="filter-actions-row">
        <button
          className="filter-more-toggle"
          type="button"
          onClick={() => setShowMoreFilters((current) => !current)}
          aria-expanded={showMoreFilters}
        >
          {showMoreFilters ? "Hide filters" : "More filters"}
        </button>
        {activeCount > 0 && (
          <button className="filter-reset-button" type="button" onClick={onReset}>
            Reset filters
          </button>
        )}
      </div>

      {showMoreFilters && (
        <div className="filter-more-panel open">
          <div className="filter-more-grid">
            <label className="field">
              <span>Min price</span>
              <input
                type="number"
                min="0"
                step="100"
                value={filters.minPrice}
                onChange={(event) => update("minPrice", event.target.value)}
                placeholder="500"
              />
            </label>
            <label className="field">
              <span>Max price</span>
              <input
                type="number"
                min="0"
                step="100"
                value={filters.maxPrice}
                onChange={(event) => update("maxPrice", event.target.value)}
                placeholder="4000"
              />
            </label>
            <label className="field">
              <span>Max duration</span>
              <input
                type="number"
                min="1"
                step="1"
                value={filters.maxDurationDays}
                onChange={(event) => update("maxDurationDays", event.target.value)}
                placeholder="15 days"
              />
            </label>
            <label className="field">
              <span>Comfort</span>
              <select value={filters.comfortLevel} onChange={(event) => update("comfortLevel", event.target.value)}>
                <option value="">Any comfort</option>
                {comfortLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tour type</span>
              <select value={filters.tourType} onChange={(event) => update("tourType", event.target.value)}>
                <option value="">Any type</option>
                {tourTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Min rating</span>
              <select value={filters.minRating} onChange={(event) => update("minRating", event.target.value)}>
                <option value="">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </label>
            <label className="filter-check-field">
              <input
                type="checkbox"
                checked={Boolean(filters.featured)}
                onChange={(event) => update("featured", event.target.checked)}
              />
              <span>
                <strong>Featured only</strong>
                <small>Show tours Travellex is promoting first.</small>
              </span>
            </label>
          </div>
        </div>
      )}
    </form>
  );
}
