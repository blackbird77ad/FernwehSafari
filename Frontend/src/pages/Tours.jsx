import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FilterBar from "../components/FilterBar";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import { getTours } from "../services/tourService";

const TOUR_PAGE_SIZE = 20;

export default function Tours() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    travelDate: searchParams.get("travelDate") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    comfortLevel: searchParams.get("comfortLevel") || "",
    tourType: searchParams.get("tourType") || "",
    minRating: searchParams.get("minRating") || "",
    sort: searchParams.get("sort") || "featured"
  });
  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: TOUR_PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      search: filters.search || undefined,
      category: filters.category || undefined,
      location: filters.location || undefined,
      travelDate: filters.travelDate || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      comfortLevel: filters.comfortLevel || undefined,
      tourType: filters.tourType || undefined,
      minRating: filters.minRating || undefined,
      sort: filters.sort || undefined,
      page,
      limit: TOUR_PAGE_SIZE
    }),
    [filters, page]
  );

  useEffect(() => {
    setLoading(true);
    getTours(query)
      .then((response) => {
        const nextTours = response.data.tours || [];
        const nextPagination = response.data.pagination || {
          page,
          limit: TOUR_PAGE_SIZE,
          total: nextTours.length,
          totalPages: 1
        };

        setTours(nextTours);
        setPagination(nextPagination);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [query, page]);

  function handleFilterChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function goToPage(nextPage) {
    setPage(Math.min(Math.max(nextPage, 1), pagination.totalPages || 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalListings = Number(pagination.total) || 0;
  const startItem = totalListings ? (Number(pagination.page) - 1) * TOUR_PAGE_SIZE + 1 : 0;
  const endItem = Math.min(Number(pagination.page) * TOUR_PAGE_SIZE, totalListings);
  const listingLabel = totalListings === 1 ? "listing" : "listings";

  return (
    <>
      <section className="page-hero compact-hero tours-hero">
        <p className="eyebrow">Tour listings</p>
        <h1>Browse approved partner tours.</h1>
        <p>
          Compare routes, prices, dates, comfort levels and operators in one focused Travellex catalog.
        </p>
      </section>

      <section className="section tour-catalog-section">
        <div className="tour-catalog-shell">
          <div className="section-heading split tour-catalog-heading">
            <div>
              <p className="eyebrow">Tour marketplace</p>
              <h2>Find the right Africa tour listing.</h2>
            </div>
            <Link className="button secondary" to="/partner">
              List a tour
            </Link>
          </div>

          <FilterBar filters={filters} onChange={handleFilterChange} />

          {loading ? (
            <Spinner />
          ) : error ? (
            <p className="empty-state">{error}</p>
          ) : tours.length ? (
            <>
              <div className="tour-results-head">
                <div>
                  <strong>
                    {totalListings} {listingLabel}
                  </strong>
                  <span>
                    Showing {startItem}-{endItem}. 20 listings per page.
                  </span>
                </div>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <div className="card-grid tours-grid public-tour-grid">
                {tours.map((tour) => (
                  <TourCard compact key={tour._id} tour={tour} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination-row tour-pagination">
                  <p className="form-note">
                    Showing {startItem}-{endItem} of {totalListings} {listingLabel}
                  </p>
                  <div className="button-row">
                    <button
                      className="button secondary compact"
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => goToPage(Number(pagination.page) - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      className="button primary compact"
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => goToPage(Number(pagination.page) + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="empty-state">No active tours match those filters.</p>
          )}
        </div>
      </section>
    </>
  );
}
