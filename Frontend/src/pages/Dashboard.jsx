import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import useAuth from "../hooks/useAuth";
import { getMyEnquiries } from "../services/enquiryService";
import { getMyReferrals } from "../services/referralService";
import { formatDate } from "../utils/formatters";

export default function Dashboard() {
  const { removeSavedTour, user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getMyEnquiries(), getMyReferrals()])
      .then(([enquiryResponse, referralResponse]) => {
        setEnquiries(enquiryResponse.data.enquiries);
        setReferrals(referralResponse.data.referrals);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(tourId) {
    try {
      await removeSavedTour(tourId);
      setMessage("Saved tour removed.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome, {user?.name}.</h1>
      </section>
      <section className="section dashboard-layout">
        <div className="dashboard-main">
          <div className="section-heading small-heading">
            <p className="eyebrow">Saved tours</p>
            <h2>Your shortlist.</h2>
          </div>
          {user?.savedTours?.length ? (
            <div className="card-grid tours-grid">
              {user.savedTours.map((tour) => (
                <div className="stacked-card" key={tour._id}>
                  <TourCard tour={tour} />
                  <button className="button secondary" type="button" onClick={() => handleRemove(tour._id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No saved tours yet. <Link to="/tours">Browse tours</Link>
            </p>
          )}
        </div>
        <aside className="dashboard-side">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <section className="side-panel">
                <p className="eyebrow">Referral history</p>
                {referrals.length ? (
                  referrals.map((referral) => (
                    <article className="mini-row" key={referral._id}>
                      <strong>{referral.tour?.title}</strong>
                      <span>{referral.converted ? "Converted" : "Pending"} · {formatDate(referral.clickedAt)}</span>
                    </article>
                  ))
                ) : (
                  <p>No referral clicks yet.</p>
                )}
              </section>
              <section className="side-panel">
                <p className="eyebrow">Enquiry history</p>
                {enquiries.length ? (
                  enquiries.map((enquiry) => (
                    <article className="mini-row" key={enquiry._id}>
                      <strong>{enquiry.tour?.title || "General enquiry"}</strong>
                      <span>{enquiry.status} · {formatDate(enquiry.createdAt)}</span>
                    </article>
                  ))
                ) : (
                  <p>No enquiries yet.</p>
                )}
              </section>
            </>
          )}
          {message && <p className="form-note">{message}</p>}
        </aside>
      </section>
    </>
  );
}
