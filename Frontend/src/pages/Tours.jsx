import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DestinationStoryCard from "../components/DestinationStoryCard";
import FilterBar from "../components/FilterBar";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import { getTours } from "../services/tourService";
import { eur } from "../utils/formatters";
import { destinationStories } from "../utils/staticContent";

function ratingLabel(tour) {
  const rating = Number(tour.reviewRating || tour.partner?.rating || 0);
  const reviewCount = Number(tour.reviewCount || tour.partner?.reviewCount || 0);

  if (!rating) {
    return "Travellex reviewed";
  }

  return `${rating.toFixed(1)} / 5${reviewCount ? ` (${reviewCount})` : ""}`;
}

function routeLabel(tour) {
  return [tour.startLocation, tour.routeSummary, tour.endLocation].filter(Boolean).join(" - ") || tour.location;
}

function inclusionsLabel(tour) {
  return tour.inclusions?.length ? tour.inclusions.slice(0, 3).join(", ") : "Ask operator";
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
    comfortLevel: searchParams.get("comfortLevel") || "",
    tourType: searchParams.get("tourType") || "",
    minRating: searchParams.get("minRating") || "",
    sort: searchParams.get("sort") || "featured"
  });
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const coastStory = destinationStories.find((story) => story.name === "Mnemba Island Atoll") || destinationStories[0];

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
      sort: filters.sort || undefined
    }),
    [filters]
  );

  const comparisonSummary = useMemo(() => {
    const destinations = new Map();

    tours.forEach((tour) => {
      const key = (tour.location || "Africa tours").toLowerCase();
      const current = destinations.get(key) || {
        location: tour.location || "Africa tours",
        count: 0,
        operators: new Set(),
        prices: []
      };

      current.count += 1;
      current.operators.add(tour.partner?.name || "Approved operator");
      current.prices.push(Number(tour.priceEUR) || 0);
      destinations.set(key, current);
    });

    return [...destinations.values()]
      .map((item) => ({
        ...item,
        operatorCount: item.operators.size,
        lowPrice: Math.min(...item.prices.filter(Boolean)),
        highPrice: Math.max(...item.prices.filter(Boolean))
      }))
      .filter((item) => item.count > 1 || item.operatorCount > 1)
      .sort((left, right) => right.operatorCount - left.operatorCount)
      .slice(0, 4);
  }, [tours]);

  const comparisonRows = useMemo(
    () =>
      [...tours]
        .sort((left, right) => {
          const locationCompare = String(left.location || "").localeCompare(String(right.location || ""), undefined, {
            sensitivity: "base"
          });

          return locationCompare || (Number(left.priceEUR) || 0) - (Number(right.priceEUR) || 0);
        })
        .slice(0, 10),
    [tours]
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
      <section className="page-hero compact-hero tours-hero">
        <p className="eyebrow">Tour listings</p>
        <h1>Africa tours and adventures, starting with Tanzania and Zanzibar.</h1>
      </section>
      <section className="section split-panel">
        <div>
          <p className="eyebrow">Start with the feeling</p>
          <h2>Wildlife days, mountain air, island streets or beach time.</h2>
        </div>
        <p className="lead">
          Use filters when you know the destination, or browse slowly when you are still shaping the journey. Each
          route is built to help you compare the practical pieces without losing the spark of travel.
        </p>
      </section>
      <section className="section">
        <FilterBar filters={filters} onChange={setFilters} />
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="empty-state">{error}</p>
        ) : tours.length ? (
          <>
            {comparisonSummary.length > 0 && (
              <div className="operator-comparison-strip" aria-label="Destinations with multiple tour operators">
                {comparisonSummary.map((item) => (
                  <article key={item.location}>
                    <span>{item.location}</span>
                    <strong>
                      {item.operatorCount} operators - {item.count} tours
                    </strong>
                    {Number.isFinite(item.lowPrice) && Number.isFinite(item.highPrice) && (
                      <small>
                        From {item.lowPrice === item.highPrice ? eur.format(item.lowPrice) : `${eur.format(item.lowPrice)} - ${eur.format(item.highPrice)}`}
                      </small>
                    )}
                  </article>
                ))}
              </div>
            )}
            {comparisonRows.length > 1 && (
              <div className="tour-compare-board" aria-label="Tour comparison">
                <div className="tour-compare-scroll">
                  <table className="tour-compare-table">
                    <thead>
                      <tr>
                        <th scope="col">Tour</th>
                        <th scope="col">Company</th>
                        <th scope="col">Price</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Comfort</th>
                        <th scope="col">Route</th>
                        <th scope="col">Includes</th>
                        <th scope="col">Reviews</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((tour) => (
                        <tr key={tour._id}>
                          <td>
                            <Link className="tour-compare-title" to={`/tours/${tour.slug}`}>
                              {tour.title}
                            </Link>
                            <small>{tour.location}</small>
                          </td>
                          <td>{tour.partner?.name || "Approved operator"}</td>
                          <td>
                            <strong>{eur.format(tour.priceEUR)}</strong>
                            <small>{tour.tourType || "Private or shared"}</small>
                          </td>
                          <td>{tour.duration}</td>
                          <td>{tour.comfortLevel || "Ask"}</td>
                          <td>{routeLabel(tour)}</td>
                          <td>{inclusionsLabel(tour)}</td>
                          <td>{ratingLabel(tour)}</td>
                          <td>
                            <div className="tour-compare-actions">
                              <Link className="button secondary compact" to={`/tours/${tour.slug}`}>
                                Details
                              </Link>
                              <Link className="button primary compact" to={`/tours/${tour.slug}#quote`}>
                                Quote
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="card-grid tours-grid">
              {tours.map((tour) => (
                <TourCard key={tour._id} tour={tour} />
              ))}
            </div>
          </>
        ) : (
          <p className="empty-state">No active tours match those filters.</p>
        )}
      </section>
      <section className="section tinted">
        <div className="section-heading">
          <p className="eyebrow">Route styles</p>
          <h2>Ways to shape an Africa adventure.</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h2>Classic safari</h2>
            <p>Wildlife-first routes with crater views, park drives, lodge stays and early morning starts.</p>
          </article>
          <article>
            <h2>Safari + coast</h2>
            <p>Combine mainland game drives with Stone Town, forest walks, reef days and north-coast beaches.</p>
          </article>
          <article>
            <h2>Culture + heritage</h2>
            <p>Slow down for local history, markets, Old Fort, Forodhani, village visits and food-led stops.</p>
          </article>
        </div>
      </section>
      <section className="section story-band">
        <div className="story-media">
          <img src={coastStory.image} alt="Zanzibar snorkelling and ocean trip" />
        </div>
        <div>
          <p className="eyebrow">Compare clearly</p>
          <h2>Look at rhythm, not only price.</h2>
          <p className="lead">
            A lower price may mean faster transfers or fewer inclusions. A longer route may make the trip calmer.
            Compare duration, geography, operator context, guide options and how much rest you want between big days.
          </p>
        </div>
      </section>
      <section className="section destination-guide">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Destination guide</p>
            <h2>Every place has a different kind of promise.</h2>
            <p className="lead">
              Use these destination notes to decide whether the journey should feel wild, coastal, cultural, active,
              restful or a little of everything.
            </p>
          </div>
          <Link className="button secondary" to="/contact">
            Ask for route help
          </Link>
        </div>
        <div className="destination-story-grid">
          {destinationStories.map((story, index) => (
            <DestinationStoryCard key={story.name} story={story} featured={index === 0} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Before you enquire</p>
          <h2>Helpful details to have ready.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span>01</span>
            <h3>Dates</h3>
            <p>Share exact dates or a travel window so availability and route pacing can be discussed properly.</p>
          </article>
          <article className="step-card">
            <span>02</span>
            <h3>Group style</h3>
            <p>Note whether you prefer private, shared, family, couple, luxury, midrange or flexible options.</p>
          </article>
          <article className="step-card">
            <span>03</span>
            <h3>Must-see places</h3>
            <p>List the stops you care about most: Ngorongoro, Kilimanjaro, Stone Town, Nungwi, Paje or others.</p>
          </article>
        </div>
      </section>
      <section className="cta-band">
        <h2>Need help choosing between routes?</h2>
        <Link className="button primary" to="/contact">
          Ask Travellex
        </Link>
      </section>
    </>
  );
}
