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
          placeholder="Ngorongoro, Paje, Mikumi"
        />
      </label>
      <label className="field">
        <span>Category</span>
        <select value={filters.category} onChange={(event) => update("category", event.target.value)}>
          <option value="">All</option>
          <option value="Safari">Safari</option>
          <option value="Beach">Beach</option>
          <option value="Cultural">Cultural</option>
          <option value="Mountain">Mountain</option>
          <option value="Combination">Combination</option>
        </select>
      </label>
      <label className="field">
        <span>Location</span>
        <input value={filters.location} onChange={(event) => update("location", event.target.value)} />
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
    </form>
  );
}
