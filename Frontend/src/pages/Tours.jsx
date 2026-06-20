import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilterBar from "../components/FilterBar";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import { getTours } from "../services/tourService";

export default function Tours() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    maxPrice: searchParams.get("maxPrice") || ""
  });
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      search: filters.search || undefined,
      category: filters.category || undefined,
      location: filters.location || undefined,
      maxPrice: filters.maxPrice || undefined
    }),
    [filters]
  );

  useEffect(() => {
    setLoading(true);
    getTours(query)
      .then((response) => {
        setTours(response.data.tours);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Tour listings</p>
        <h1>Tanzania safari, Kilimanjaro and Zanzibar tours for European travellers.</h1>
      </section>
      <section className="section">
        <FilterBar filters={filters} onChange={setFilters} />
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="empty-state">{error}</p>
        ) : tours.length ? (
          <div className="card-grid tours-grid">
            {tours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        ) : (
          <p className="empty-state">No active tours match those filters.</p>
        )}
      </section>
    </>
  );
}
