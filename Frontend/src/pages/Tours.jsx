import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FilterBar from "../components/FilterBar";
import SEO from "../components/SEO";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import { getTours } from "../services/tourService";
import { buildBreadcrumbSchema, buildTourItemListSchema } from "../utils/seoConfig";
import { tourSortOptions } from "../utils/travelOptions";

const DEFAULT_TOUR_PAGE_SIZE = 12;
const TOUR_PAGE_SIZE_OPTIONS = [12, 24, 48];

const DEFAULT_TOUR_FILTERS = {
  search: "",
  category: "",
  location: "",
  travelDate: "",
  minPrice: "",
  maxPrice: "",
  maxDurationDays: "",
  comfortLevel: "",
  tourType: "",
  minRating: "",
  featured: false,
  sort: "featured"
};

function getInitialPage(value) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getInitialPageSize(value) {
  const pageSize = Number(value);
  return TOUR_PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : DEFAULT_TOUR_PAGE_SIZE;
}

function getVisiblePaginationItems(currentPage, totalPages) {
  const page = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages || 1);
  const total = Math.max(Number(totalPages) || 1, 1);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, page, page - 1, page + 1]);

  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (page >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sortedPages = [...pages].filter((item) => item >= 1 && item <= total).sort((a, b) => a - b);

  return sortedPages.flatMap((item, index) => {
    const previous = sortedPages[index - 1];

    if (previous && item - previous > 1) {
      return [`gap-${previous}-${item}`, item];
    }

    return [item];
  });
}

export default function Tours() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    travelDate: searchParams.get("travelDate") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    maxDurationDays: searchParams.get("maxDurationDays") || "",
    comfortLevel: searchParams.get("comfortLevel") || "",
    tourType: searchParams.get("tourType") || "",
    minRating: searchParams.get("minRating") || "",
    featured: searchParams.get("featured") === "true",
    sort: searchParams.get("sort") || "featured"
  });
  const [tours, setTours] = useState([]);
  const [pageSize, setPageSize] = useState(getInitialPageSize(searchParams.get("limit")));
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [page, setPage] = useState(getInitialPage(searchParams.get("page")));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const query = useMemo(
    () => ({
      search: filters.search || undefined,
      category: filters.category || undefined,
      location: filters.location || undefined,
      travelDate: filters.travelDate || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      maxDurationDays: filters.maxDurationDays || undefined,
      comfortLevel: filters.comfortLevel || undefined,
      tourType: filters.tourType || undefined,
      minRating: filters.minRating || undefined,
      featured: filters.featured ? "true" : undefined,
      sort: filters.sort || undefined,
      page,
      limit: pageSize
    }),
    [filters, page, pageSize]
  );

  useEffect(() => {
    setLoading(true);
    getTours(query)
      .then((response) => {
        const nextTours = response.data.tours || [];
        const nextPagination = response.data.pagination || {
          page,
          limit: pageSize,
          total: nextTours.length,
          totalPages: 1
        };

        if (Number(nextPagination.totalPages) && Number(nextPagination.page) > Number(nextPagination.totalPages)) {
          setPage(Number(nextPagination.totalPages));
          return;
        }

        setTours(nextTours);
        setPagination(nextPagination);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [query, page, pageSize]);

  function handleFilterChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_TOUR_FILTERS);
    setPage(1);
  }

  function removeActiveFilter(field) {
    setFilters((current) => {
      if (field === "price") {
        return { ...current, minPrice: "", maxPrice: "" };
      }

      return { ...current, [field]: DEFAULT_TOUR_FILTERS[field] };
    });
    setPage(1);
  }

  function updateSort(value) {
    setFilters((current) => ({ ...current, sort: value }));
    setPage(1);
  }

  function updatePageSize(value) {
    setPageSize(getInitialPageSize(value));
    setPage(1);
  }

  function goToPage(nextPage) {
    setPage(Math.min(Math.max(nextPage, 1), pagination.totalPages || 1));
    document.getElementById("tour-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const totalListings = Number(pagination.total) || 0;
  const currentPage = Number(pagination.page) || page;
  const totalPages = Number(pagination.totalPages) || 1;
  const currentLimit = Number(pagination.limit) || pageSize;
  const startItem = totalListings ? (currentPage - 1) * currentLimit + 1 : 0;
  const endItem = Math.min(currentPage * currentLimit, totalListings);
  const listingLabel = totalListings === 1 ? "listing" : "listings";
  const tourLabel = totalListings === 1 ? "tour" : "tours";
  const sortLabel = tourSortOptions.find((option) => option.value === filters.sort)?.label || "Featured first";
  const paginationItems = getVisiblePaginationItems(currentPage, totalPages);
  const resultsHeadline = loading
    ? "Loading curated tours..."
    : totalListings
      ? `Showing ${startItem}-${endItem} of ${totalListings} ${tourLabel}`
      : "No tours found yet";
  const resultsMeta = loading
    ? "Checking live availability."
    : `Page ${currentPage} of ${totalPages}. Sorted by ${sortLabel}.`;
  const toursJsonLd = useMemo(
    () => [
      buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Tours", path: "/tours" }
      ]),
      buildTourItemListSchema(tours)
    ],
    [tours]
  );
  const activeFilters = [
    filters.search && { field: "search", label: `Search: ${filters.search}` },
    filters.location && { field: "location", label: `Destination: ${filters.location}` },
    filters.category && { field: "category", label: filters.category },
    filters.travelDate && { field: "travelDate", label: `Date: ${filters.travelDate}` },
    (filters.minPrice || filters.maxPrice) && {
      field: "price",
      label: `Price: ${filters.minPrice || "0"}-${filters.maxPrice || "any"} EUR`
    },
    filters.maxDurationDays && { field: "maxDurationDays", label: `Up to ${filters.maxDurationDays} days` },
    filters.comfortLevel && { field: "comfortLevel", label: filters.comfortLevel },
    filters.tourType && { field: "tourType", label: filters.tourType },
    filters.minRating && { field: "minRating", label: `${filters.minRating}+ rating` },
    filters.featured && { field: "featured", label: "Featured only" }
  ].filter(Boolean);

  return (
    <section className="tour-listing-page">
      <SEO
        canonicalPath="/tours"
        description="Search approved Africa tours with EUR pricing, including Tanzania safari, Zanzibar beach, Kilimanjaro, Ngorongoro, Stone Town and wider African travel routes."
        jsonLd={toursJsonLd}
        keywords={[
          "Africa tours",
          "Tanzania safari tours",
          "Zanzibar tours",
          "Germany to Africa tours",
          "African safari packages",
          "Kilimanjaro tours"
        ]}
        title="Africa Tours, Tanzania Safaris and Zanzibar Trips"
      />
      <div className="tour-marketplace-hero">
        <div className="tour-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Tours</span>
        </div>
        <div className="tour-marketplace-hero-inner">
          <div>
            <p className="eyebrow">Tour marketplace</p>
            <h1>Discover Africa</h1>
            <p>
              Explore authentic safaris, cultural journeys, coastal escapes and curated adventures from approved Travellex partners.
            </p>
          </div>
          <div className="tour-marketplace-hero-actions">
            <Link className="button primary" to="/partner">
              List your tour
            </Link>
            <a className="button secondary light" href="#tour-results">
              Browse tours
            </a>
          </div>
        </div>
      </div>

      <section className="tour-marketplace-section" id="tour-results">
        <div className="tour-marketplace-shell">
          <button
            className={filterDrawerOpen ? "tour-filter-backdrop show" : "tour-filter-backdrop"}
            type="button"
            aria-label="Close tour filters"
            onClick={() => setFilterDrawerOpen(false)}
          />

          <aside className={filterDrawerOpen ? "tour-filter-panel open" : "tour-filter-panel"} aria-label="Tour filters">
            <div className="tour-filter-panel-head">
              <div>
                <span>Refine search</span>
                <strong>{activeFilters.length ? `${activeFilters.length} active filters` : "Find your fit"}</strong>
              </div>
              <button
                className="tour-filter-close"
                type="button"
                aria-label="Close filters"
                onClick={() => setFilterDrawerOpen(false)}
              >
                Close
              </button>
            </div>
            <FilterBar
              activeCount={activeFilters.length}
              filters={filters}
              onChange={handleFilterChange}
              onReset={resetFilters}
            />
          </aside>

          <div className="tour-results-panel">
            <div className="tour-catalog-heading">
              <div>
                <p className="eyebrow">Approved partner tours</p>
                <h2>Curated listings, simple comparison.</h2>
              </div>
              <Link className="button secondary" to="/partner">
                List a tour
              </Link>
            </div>

            <div className="tour-results-head luxury-results-head">
              <div className="tour-results-summary">
                <span className="eyebrow">Showing results</span>
                <strong>{resultsHeadline}</strong>
                <small>{resultsMeta}</small>
              </div>
              <div className="tour-results-tools">
                <button className="button secondary compact mobile-filter-button" type="button" onClick={() => setFilterDrawerOpen(true)}>
                  Filters
                </button>
                <div className="view-switcher" aria-label="Choose listing view">
                  <button
                    className={viewMode === "list" ? "active" : ""}
                    type="button"
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </button>
                  <button
                    className={viewMode === "grid" ? "active" : ""}
                    type="button"
                    onClick={() => setViewMode("grid")}
                  >
                    Grid
                  </button>
                </div>
                <label className="result-sort-field">
                  <span className="sr-only">Sort tours</span>
                  <select value={filters.sort} onChange={(event) => updateSort(event.target.value)}>
                    {tourSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="result-sort-field pagination-size-field">
                  <span className="sr-only">Tours per page</span>
                  <select value={pageSize} onChange={(event) => updatePageSize(event.target.value)}>
                    {TOUR_PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} per page
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {activeFilters.length > 0 && (
                <div className="active-filter-row">
                  {activeFilters.map((filter) => (
                    <button key={filter.field} type="button" onClick={() => removeActiveFilter(filter.field)}>
                      {filter.label}
                      <span aria-hidden="true">x</span>
                    </button>
                  ))}
                  <button className="clear-filter-chip" type="button" onClick={resetFilters}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="tour-loading-panel">
                <Spinner label="Loading curated tours" />
              </div>
            ) : error ? (
              <p className="empty-state tour-empty-state">{error}</p>
            ) : tours.length ? (
              <>
                <div className={`card-grid public-tour-grid view-${viewMode}`}>
                  {tours.map((tour) => (
                    <TourCard
                      key={tour._id}
                      tour={tour}
                      variant={viewMode === "list" ? "catalog" : "market"}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination-row tour-pagination luxury-pagination">
                    <p className="form-note">
                      Showing {startItem}-{endItem} of {totalListings} {listingLabel}
                    </p>
                    <div className="pagination-controls" aria-label="Tour pagination">
                      <button
                        className="button secondary compact"
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        Previous
                      </button>
                      <div className="pagination-pages">
                        {paginationItems.map((item) =>
                          typeof item === "string" ? (
                            <span className="pagination-page-gap" key={item}>
                              ...
                            </span>
                          ) : (
                            <button
                              className={item === currentPage ? "pagination-page-button active" : "pagination-page-button"}
                              key={item}
                              type="button"
                              onClick={() => goToPage(item)}
                              aria-current={item === currentPage ? "page" : undefined}
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        className="button primary compact"
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="empty-state tour-empty-state">No active tours match those filters.</p>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
