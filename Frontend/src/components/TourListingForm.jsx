import { useEffect, useMemo, useState } from "react";
import { activityOptions, comfortLevelOptions, confirmationTypeOptions, priceBasisOptions, tourTypeOptions } from "../utils/travelOptions";
import {
  isTourMediaLimitExceeded,
  MAX_TOUR_MEDIA_ITEMS,
  splitTourMedia
} from "../utils/tourMedia";

const wizardSteps = [
  {
    id: "basics",
    label: "Basics",
    title: "Listing basics",
    description: "Set the public title, price, destination and traveller-facing summary."
  },
  {
    id: "experience",
    label: "Experience",
    title: "Experience details",
    description: "Describe the route, itinerary, logistics, dates and comfort level."
  },
  {
    id: "media",
    label: "Media",
    title: "Media and booking",
    description: "Add the gallery, booking link and marketplace controls."
  },
  {
    id: "publish",
    label: "Publish",
    title: "Policies and publish",
    description: "Finish inclusions, policies, visibility and homepage settings."
  }
];

function InlineInfo({ text }) {
  return (
    <span className="info-hint" tabIndex="0" aria-label={text}>
      <span aria-hidden="true">i</span>
      <span className="info-hint-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className={hint ? "label-with-info" : undefined}>
        {label}
        {hint && <InlineInfo text={hint} />}
      </span>
      {children}
    </label>
  );
}

function WizardSection({ activeStep, children, description, step, title }) {
  const isActive = activeStep === step;

  return (
    <section className="tour-wizard-section" hidden={!isActive}>
      <div className="tour-wizard-section-head">
        <span>{wizardSteps.find((item) => item.id === step)?.label}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="tour-wizard-fields">{children}</div>
    </section>
  );
}

export default function TourListingForm({
  allowStatusControls = false,
  cancelLabel = "Cancel",
  commissionSettings = {},
  editing = false,
  form,
  isAdmin = false,
  onCancel,
  onFieldChange,
  onSubmit,
  onUpload,
  partnerOptions = [],
  showCommissionField = false,
  showPartnerSelect = false,
  showReviewFields = false,
  showVrFields = false,
  submitting = false,
  submitLabel,
  uploading = false
}) {
  const [activeStep, setActiveStep] = useState("basics");
  const activeStepIndex = wizardSteps.findIndex((step) => step.id === activeStep);
  const mediaCount = splitTourMedia(form.images).length;
  const mediaLimitExceeded = isTourMediaLimitExceeded(form.images);
  const completedSteps = useMemo(
    () => ({
      basics: Boolean(form.title && form.location && form.priceEUR && form.duration),
      experience: Boolean(form.routeSummary || form.itinerary || form.meetingPoint || form.availableFrom),
      media: Boolean(mediaCount),
      publish: Boolean(form.inclusions || form.highlights || form.cancellationPolicy || form.paymentTerms)
    }),
    [form.availableFrom, form.cancellationPolicy, form.duration, form.highlights, form.inclusions, form.itinerary, form.location, form.meetingPoint, form.paymentTerms, form.priceEUR, form.routeSummary, form.title, mediaCount]
  );

  useEffect(() => {
    setActiveStep("basics");
  }, [editing]);

  function goToStep(direction) {
    const nextIndex = Math.min(Math.max(activeStepIndex + direction, 0), wizardSteps.length - 1);
    setActiveStep(wizardSteps[nextIndex].id);
  }

  return (
    <form className="panel-form listing-wizard-form" onSubmit={onSubmit}>
      <div className="listing-wizard-head">
        <div>
          <p className="eyebrow">{editing ? "Edit listing" : "Create listing"}</p>
          <h2>{editing ? "Refine this public listing" : "Build a polished tour listing"}</h2>
          <span>
            {mediaCount}/{MAX_TOUR_MEDIA_ITEMS} media items added
          </span>
        </div>
        <div className="listing-wizard-progress" aria-label="Listing form progress">
          {wizardSteps.map((step, index) => (
            <button
              className={activeStep === step.id ? "active" : completedSteps[step.id] ? "complete" : ""}
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              aria-current={activeStep === step.id ? "step" : undefined}
            >
              <b>{index + 1}</b>
              <span>{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tour-wizard">
        <WizardSection activeStep={activeStep} step="basics" title="Listing basics" description="Keep this tight, searchable and easy to scan.">
          <Field label="Title">
            <input value={form.title} onChange={(event) => onFieldChange("title", event.target.value)} />
          </Field>
          <Field label="Short description">
            <input value={form.shortDescription} onChange={(event) => onFieldChange("shortDescription", event.target.value)} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(event) => onFieldChange("description", event.target.value)} rows="4" />
          </Field>
          <div className="form-grid">
            <Field label="Price EUR">
              <input type="number" min="0" value={form.priceEUR} onChange={(event) => onFieldChange("priceEUR", event.target.value)} />
            </Field>
            <Field label="Price basis">
              <select value={form.priceBasis} onChange={(event) => onFieldChange("priceBasis", event.target.value)}>
                {priceBasisOptions.map((basis) => (
                  <option key={basis} value={basis}>
                    {basis}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration">
              <input value={form.duration} onChange={(event) => onFieldChange("duration", event.target.value)} />
            </Field>
            <Field label="Duration days">
              <input type="number" min="1" value={form.durationDays} onChange={(event) => onFieldChange("durationDays", event.target.value)} />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(event) => onFieldChange("location", event.target.value)} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(event) => onFieldChange("category", event.target.value)}>
                {activityOptions.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Child price EUR">
              <input type="number" min="0" value={form.childPriceEUR} onChange={(event) => onFieldChange("childPriceEUR", event.target.value)} />
            </Field>
            <Field label="Single supplement EUR">
              <input type="number" min="0" value={form.singleSupplementEUR} onChange={(event) => onFieldChange("singleSupplementEUR", event.target.value)} />
            </Field>
            <Field label="Deposit %">
              <input type="number" min="0" max="100" value={form.depositPercent} onChange={(event) => onFieldChange("depositPercent", event.target.value)} />
            </Field>
            <Field label="Booking cutoff days">
              <input type="number" min="0" value={form.bookingCutoffDays} onChange={(event) => onFieldChange("bookingCutoffDays", event.target.value)} />
            </Field>
          </div>
        </WizardSection>

        <WizardSection activeStep={activeStep} step="experience" title="Experience details" description="Structure the traveller journey and operational details.">
          <div className="form-grid">
            <Field label="Comfort level">
              <select value={form.comfortLevel} onChange={(event) => onFieldChange("comfortLevel", event.target.value)}>
                {comfortLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tour type">
              <select value={form.tourType} onChange={(event) => onFieldChange("tourType", event.target.value)}>
                {tourTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start location">
              <input value={form.startLocation} onChange={(event) => onFieldChange("startLocation", event.target.value)} />
            </Field>
            <Field label="End location">
              <input value={form.endLocation} onChange={(event) => onFieldChange("endLocation", event.target.value)} />
            </Field>
          </div>
          <div className="checkbox-row">
            <label>
              <input type="checkbox" checked={form.guideIncluded} onChange={(event) => onFieldChange("guideIncluded", event.target.checked)} />
              Guide included
            </label>
            <label>
              <input type="checkbox" checked={form.customizable} onChange={(event) => onFieldChange("customizable", event.target.checked)} />
              Customizable
            </label>
          </div>
          <div className="form-grid">
            <Field label="Group size min">
              <input type="number" min="1" value={form.groupSizeMin} onChange={(event) => onFieldChange("groupSizeMin", event.target.value)} />
            </Field>
            <Field label="Group size max">
              <input type="number" min="1" value={form.groupSizeMax} onChange={(event) => onFieldChange("groupSizeMax", event.target.value)} />
            </Field>
            <Field label="Minimum age">
              <input type="number" min="0" value={form.minimumAge} onChange={(event) => onFieldChange("minimumAge", event.target.value)} />
            </Field>
          </div>
          <Field label="Languages, one per line">
            <textarea value={form.languages} onChange={(event) => onFieldChange("languages", event.target.value)} rows="3" />
          </Field>
          <Field label="Route summary">
            <input
              value={form.routeSummary}
              onChange={(event) => onFieldChange("routeSummary", event.target.value)}
              placeholder="Arusha - Tarangire - Ngorongoro - Zanzibar"
            />
          </Field>
          <Field label="Daily itinerary, one day per line">
            <textarea
              value={form.itinerary}
              onChange={(event) => onFieldChange("itinerary", event.target.value)}
              placeholder="Day 1 | Arrival in Arusha | Pickup, briefing and overnight stay"
              rows="5"
            />
          </Field>
          <div className="form-grid">
            <Field label="Meeting point">
              <input value={form.meetingPoint} onChange={(event) => onFieldChange("meetingPoint", event.target.value)} />
            </Field>
            <Field label="Departure time">
              <input value={form.departureTime} onChange={(event) => onFieldChange("departureTime", event.target.value)} placeholder="08:00 or Flexible" />
            </Field>
            <Field label="Return time">
              <input value={form.returnTime} onChange={(event) => onFieldChange("returnTime", event.target.value)} placeholder="17:30 or Flexible" />
            </Field>
          </div>
          <label className="checkbox-inline">
            <input type="checkbox" checked={form.pickupIncluded} onChange={(event) => onFieldChange("pickupIncluded", event.target.checked)} />
            Pickup included
          </label>
          <Field label="Pickup details">
            <textarea value={form.pickupDetails} onChange={(event) => onFieldChange("pickupDetails", event.target.value)} rows="2" />
          </Field>
          <div className="form-grid">
            <Field label="Difficulty">
              <input value={form.difficulty} onChange={(event) => onFieldChange("difficulty", event.target.value)} />
            </Field>
            <Field label="Accessibility notes">
              <input
                value={form.accessibility}
                onChange={(event) => onFieldChange("accessibility", event.target.value)}
                placeholder="Wheelchair access, mobility limits, steps"
              />
            </Field>
            <Field label="Transport">
              <input value={form.transport} onChange={(event) => onFieldChange("transport", event.target.value)} />
            </Field>
            <Field label="Accommodation">
              <input value={form.accommodation} onChange={(event) => onFieldChange("accommodation", event.target.value)} />
            </Field>
            <Field label="Meals">
              <input value={form.meals} onChange={(event) => onFieldChange("meals", event.target.value)} />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Available from">
              <input type="date" value={form.availableFrom} onChange={(event) => onFieldChange("availableFrom", event.target.value)} />
            </Field>
            <Field label="Available to">
              <input type="date" value={form.availableTo} onChange={(event) => onFieldChange("availableTo", event.target.value)} />
            </Field>
            <Field label="Confirmation type">
              <select value={form.confirmationType} onChange={(event) => onFieldChange("confirmationType", event.target.value)}>
                {confirmationTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            {showReviewFields && (
              <>
                <Field label="Review rating">
                  <input type="number" min="0" max="5" step="0.1" value={form.reviewRating} onChange={(event) => onFieldChange("reviewRating", event.target.value)} />
                </Field>
                <Field label="Review count">
                  <input type="number" min="0" value={form.reviewCount} onChange={(event) => onFieldChange("reviewCount", event.target.value)} />
                </Field>
              </>
            )}
          </div>
          <Field label="Available weekdays, one per line">
            <textarea
              value={form.availableWeekdays}
              onChange={(event) => onFieldChange("availableWeekdays", event.target.value)}
              placeholder={"Daily\nMonday\nFriday"}
              rows="3"
            />
          </Field>
        </WizardSection>

        <WizardSection activeStep={activeStep} step="media" title="Media and booking" description="The first media item becomes the main card preview.">
          {showPartnerSelect && (
            <Field label="Partner">
              <select value={form.partner} onChange={(event) => onFieldChange("partner", event.target.value)}>
                <option value="">Choose partner</option>
                {partnerOptions.map((partner) => (
                  <option key={partner.value} value={partner.value}>
                    {partner.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label={isAdmin ? "Referral link" : "External booking/referral link (optional)"}
            hint={
              isAdmin
                ? "Optional handoff URL for partner booking tracking."
                : "Leave this blank to keep booking tracking inside Travellex. Add it only when the listing must hand off to another booking page."
            }
          >
            <input
              value={form.referralLink}
              onChange={(event) => onFieldChange("referralLink", event.target.value)}
              placeholder={isAdmin ? "" : "Leave blank to keep booking inside Travellex"}
            />
          </Field>
          {showCommissionField && (
            <Field
              label="Special commission for this tour %"
              hint="Optional override. Leave blank to use the default commission set under Commission Settings."
            >
              <input
                type="number"
                min="0"
                max="100"
                value={form.commissionRatePercent}
                onChange={(event) => onFieldChange("commissionRatePercent", event.target.value)}
                placeholder={`${commissionSettings.defaultCommissionRatePercent || 0}% normal rate`}
              />
            </Field>
          )}
          <Field label="Upload tour media" hint={`Add photos or short videos. Each listing can keep up to ${MAX_TOUR_MEDIA_ITEMS} media items.`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={onUpload}
              disabled={uploading || mediaCount >= MAX_TOUR_MEDIA_ITEMS}
            />
          </Field>
          {uploading && <p className="form-note">Uploading media...</p>}
          <Field label="Tour media URLs, one per line" hint={`Add up to ${MAX_TOUR_MEDIA_ITEMS} image or video URLs. The first item is the main listing preview.`}>
            <textarea
              value={form.images}
              onChange={(event) => onFieldChange("images", event.target.value)}
              placeholder={"https://example.com/tour-photo.jpg\nhttps://example.com/tour-video.mp4"}
            />
            <small className={mediaLimitExceeded ? "field-counter error" : "field-counter"}>
              {mediaCount}/{MAX_TOUR_MEDIA_ITEMS} media items
            </small>
          </Field>
          {showVrFields && (
            <div className="vr-admin-panel">
              <label className="checkbox-inline">
                <input type="checkbox" checked={form.vrEnabled} onChange={(event) => onFieldChange("vrEnabled", event.target.checked)} />
                Enable VR for this tour
              </label>
              <div className="form-grid">
                <Field label="VR media type" hint="VR media is separate from the normal tour gallery and is only enabled by admins.">
                  <select value={form.vrMediaType} onChange={(event) => onFieldChange("vrMediaType", event.target.value)}>
                    <option value="image">360 image</option>
                    <option value="video">360 video</option>
                  </select>
                </Field>
                <Field label="VR media URL">
                  <input value={form.vrMediaUrl} onChange={(event) => onFieldChange("vrMediaUrl", event.target.value)} placeholder="Image or video URL" />
                </Field>
              </div>
              <Field label="VR caption">
                <input value={form.vrCaption} onChange={(event) => onFieldChange("vrCaption", event.target.value)} placeholder="What the traveller is seeing" />
              </Field>
              <p className="form-note">Only admins can enable VR. Partner media stays normal until Travellex approves it here.</p>
            </div>
          )}
        </WizardSection>

        <WizardSection activeStep={activeStep} step="publish" title="Policies and publish" description="Complete the details travellers compare before booking.">
          <Field label="Inclusions, one per line">
            <textarea value={form.inclusions} onChange={(event) => onFieldChange("inclusions", event.target.value)} />
          </Field>
          <Field label="Exclusions, one per line">
            <textarea value={form.exclusions} onChange={(event) => onFieldChange("exclusions", event.target.value)} />
          </Field>
          <Field label="Highlights, one per line">
            <textarea value={form.highlights} onChange={(event) => onFieldChange("highlights", event.target.value)} />
          </Field>
          <Field label="What to bring, one per line">
            <textarea value={form.whatToBring} onChange={(event) => onFieldChange("whatToBring", event.target.value)} />
          </Field>
          <Field label="Not suitable for, one per line">
            <textarea value={form.notSuitableFor} onChange={(event) => onFieldChange("notSuitableFor", event.target.value)} />
          </Field>
          <Field label="Cancellation policy">
            <textarea value={form.cancellationPolicy} onChange={(event) => onFieldChange("cancellationPolicy", event.target.value)} rows="3" />
          </Field>
          <Field label="Payment terms">
            <textarea value={form.paymentTerms} onChange={(event) => onFieldChange("paymentTerms", event.target.value)} rows="3" />
          </Field>
          {allowStatusControls && (
            <div className="checkbox-row">
              <label>
                <input type="checkbox" checked={form.featured} onChange={(event) => onFieldChange("featured", event.target.checked)} />
                <span className="label-with-info">
                  Featured
                  <InlineInfo text="Shows this listing in featured/homepage surfaces when the tour is also active." />
                </span>
              </label>
              <label>
                <input type="checkbox" checked={form.isActive} onChange={(event) => onFieldChange("isActive", event.target.checked)} />
                <span className="label-with-info">
                  Active
                  <InlineInfo text="Controls whether travellers can see this listing on the public tours page." />
                </span>
              </label>
            </div>
          )}
        </WizardSection>
      </div>

      <div className="tour-wizard-footer">
        <button className="button secondary" type="button" onClick={() => goToStep(-1)} disabled={activeStepIndex === 0}>
          Previous
        </button>
        {activeStepIndex < wizardSteps.length - 1 ? (
          <button className="button secondary" type="button" onClick={() => goToStep(1)}>
            Next step
          </button>
        ) : (
          <button className="button primary" type="submit" disabled={submitting || uploading || mediaLimitExceeded}>
            {submitting ? "Saving..." : submitLabel || (editing ? "Update listing" : "Create listing")}
          </button>
        )}
        {onCancel && (
          <button className="button secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  );
}
