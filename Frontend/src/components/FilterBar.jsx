import { activityOptions, destinationOptions, tourSortOptions } from "../utils/travelOptions";

export default function FilterBar({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <form className="filter-bar">
      <label className="field wide">
        <span>Search</span>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Country, city, safari, coast or route"
        />
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
        <span>Sort</span>
        <select value={filters.sort} onChange={(event) => update("sort", event.target.value)}>
          {tourSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
