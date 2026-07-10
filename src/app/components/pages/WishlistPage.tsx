import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  FileDown,
  GitCompare,
  Globe2,
  Heart,
  LayoutGrid,
  Search,
  Share2,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import campusImage from "../../../assets/edvora-campus.jpg";
import { universities } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

type University = (typeof universities)[number];
type WishlistView = "saved" | "compare";
type GroupMode = "none" | "country";
type SortMode = "match" | "ranking" | "tuition" | "name";

const countryCodes: Record<string, string> = {
  Canada: "CA",
  Germany: "DE",
  Italy: "IT",
  Netherlands: "NL",
  Poland: "PL",
  Sweden: "SE",
  "United Kingdom": "UK",
  "United States": "US",
};

function formatTuition(university: University) {
  if (university.tuition === 0) {
    return "No tuition";
  }

  return (
    new Intl.NumberFormat("en", {
      currency: university.currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(university.tuition) + " / year"
  );
}

const comparisonRows: Array<{
  label: string;
  render: (university: University) => ReactNode;
}> = [
  { label: "World ranking", render: (university) => "#" + university.ranking },
  { label: "Profile match", render: (university) => university.matchScore + "%" },
  { label: "Annual tuition", render: (university) => formatTuition(university) },
  { label: "Acceptance rate", render: (university) => university.acceptanceRate + "%" },
  { label: "IELTS minimum", render: (university) => university.ieltsMin },
  { label: "GPA minimum", render: (university) => university.gpaMin + " / 4.0" },
  {
    label: "Scholarship",
    render: (university) => (university.scholarshipAvailable ? "Available" : "Not listed"),
  },
  { label: "Primary intake", render: (university) => university.intakes[0] ?? "Varies" },
  { label: "Campus type", render: (university) => university.type },
];

export function WishlistPage() {
  const navigate = useNavigate();
  const {
    clearCompareUniversities,
    compareUniversityIds,
    setUniversityNote,
    toggleUniversityCompare,
    toggleUniversitySave,
    universityNotes,
    wishlistUniversities,
  } = useAppData();
  const [view, setView] = useState<WishlistView>("saved");
  const [query, setQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [sortMode, setSortMode] = useState<SortMode>("match");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const selectedCompareUniversities = wishlistUniversities.filter((university) =>
    compareUniversityIds.includes(university.id),
  );

  const filteredUniversities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return wishlistUniversities
      .filter((university) => {
        if (!normalizedQuery) {
          return true;
        }

        return [university.name, university.city, university.country, ...university.programs]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((first, second) => {
        if (sortMode === "ranking") return first.ranking - second.ranking;
        if (sortMode === "tuition") return first.tuition - second.tuition;
        if (sortMode === "name") return first.name.localeCompare(second.name);
        return second.matchScore - first.matchScore;
      });
  }, [query, sortMode, wishlistUniversities]);

  const groupedUniversities = useMemo(() => {
    if (groupMode === "none") {
      return [{ label: "Saved universities", universities: filteredUniversities }];
    }

    const countries = Array.from(new Set(filteredUniversities.map((university) => university.country))).sort();

    return countries.map((country) => ({
      label: country,
      universities: filteredUniversities.filter((university) => university.country === country),
    }));
  }, [filteredUniversities, groupMode]);

  const countryCount = new Set(wishlistUniversities.map((university) => university.country)).size;
  const averageMatch = wishlistUniversities.length
    ? Math.round(
        wishlistUniversities.reduce((total, university) => total + university.matchScore, 0) /
          wishlistUniversities.length,
      )
    : 0;

  const toggleCompare = (university: University) => {
    const selected = compareUniversityIds.includes(university.id);

    if (!selected && selectedCompareUniversities.length >= 3) {
      setActionStatus("You can compare up to three universities at a time.");
      return;
    }

    toggleUniversityCompare(university.id);
    setActionStatus(
      selected
        ? university.name + " removed from comparison."
        : university.name + " added to comparison.",
    );
  };

  const removeUniversity = (university: University) => {
    toggleUniversitySave(university.id);

    if (editingNoteId === university.id) {
      setEditingNoteId(null);
      setNoteDraft("");
    }

    setActionStatus(university.name + " removed from your wishlist.");
  };

  const beginNote = (university: University) => {
    setEditingNoteId(university.id);
    setNoteDraft(universityNotes[university.id] ?? "");
  };

  const saveNote = (university: University) => {
    setUniversityNote(university.id, noteDraft);
    setEditingNoteId(null);
    setActionStatus(noteDraft.trim() ? "Private note saved." : "Private note removed.");
  };

  const shareWishlist = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/wishlist");
      setActionStatus("Wishlist link copied to your clipboard.");
    } catch {
      setActionStatus("Your browser blocked clipboard access. Copy the current page URL instead.");
    }
  };

  const emptyState = wishlistUniversities.length === 0;

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <header className="wishlist-heading">
          <div>
            <span className="wishlist-eyebrow">Decision workspace</span>
            <h1>Your university shortlist</h1>
            <p>Compare the options that matter and keep your private decision notes together.</p>
          </div>

          <div className="wishlist-heading-actions">
            <button type="button" className="glass-interactive" onClick={shareWishlist}>
              <Share2 size={15} aria-hidden="true" />
              Share
            </button>
            <button type="button" className="glass-interactive" onClick={() => window.print()}>
              <FileDown size={15} aria-hidden="true" />
              Export PDF
            </button>
          </div>
        </header>

        {actionStatus && (
          <div className="wishlist-status" role="status">
            <Check size={15} aria-hidden="true" />
            <span>{actionStatus}</span>
            <button
              type="button"
              onClick={() => setActionStatus("")}
              aria-label="Dismiss message"
              title="Dismiss"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        <section className="wishlist-summary" aria-label="Wishlist overview">
          <article>
            <Heart size={17} aria-hidden="true" />
            <div>
              <strong>{wishlistUniversities.length}</strong>
              <span>Saved universities</span>
            </div>
          </article>
          <article>
            <Globe2 size={17} aria-hidden="true" />
            <div>
              <strong>{countryCount}</strong>
              <span>Countries represented</span>
            </div>
          </article>
          <article>
            <Award size={17} aria-hidden="true" />
            <div>
              <strong>{averageMatch}%</strong>
              <span>Average profile match</span>
            </div>
          </article>
          <article>
            <GitCompare size={17} aria-hidden="true" />
            <div>
              <strong>{selectedCompareUniversities.length}/3</strong>
              <span>Selected to compare</span>
            </div>
          </article>
        </section>

        <div className="wishlist-mode-row">
          <nav className="wishlist-tabs" aria-label="Wishlist views">
            <button
              type="button"
              className={view === "saved" ? "is-active" : ""}
              onClick={() => setView("saved")}
              aria-current={view === "saved" ? "page" : undefined}
            >
              <LayoutGrid size={15} aria-hidden="true" />
              Saved
            </button>
            <button
              type="button"
              className={view === "compare" ? "is-active" : ""}
              onClick={() => setView("compare")}
              aria-current={view === "compare" ? "page" : undefined}
            >
              <GitCompare size={15} aria-hidden="true" />
              Compare
              <span>{selectedCompareUniversities.length}</span>
            </button>
          </nav>

          {view === "saved" && !emptyState && (
            <div className="wishlist-controls">
              <label className="wishlist-search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search saved universities</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search shortlist"
                />
              </label>

              <label className="wishlist-select">
                <span className="sr-only">Group universities</span>
                <select
                  value={groupMode}
                  onChange={(event) => setGroupMode(event.target.value as GroupMode)}
                >
                  <option value="none">No grouping</option>
                  <option value="country">Group by country</option>
                </select>
                <ChevronDown size={13} aria-hidden="true" />
              </label>

              <label className="wishlist-select">
                <span className="sr-only">Sort universities</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                >
                  <option value="match">Best match</option>
                  <option value="ranking">Highest ranking</option>
                  <option value="tuition">Lowest tuition</option>
                  <option value="name">Name</option>
                </select>
                <ChevronDown size={13} aria-hidden="true" />
              </label>
            </div>
          )}
        </div>

        {view === "saved" ? (
          emptyState ? (
            <section className="wishlist-empty">
              <span>
                <Heart size={24} aria-hidden="true" />
              </span>
              <h2>Build your first shortlist</h2>
              <p>Save universities from Search or any university detail page and they will appear here.</p>
              <button type="button" onClick={() => navigate("/search")}>
                Browse universities
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </section>
          ) : filteredUniversities.length === 0 ? (
            <section className="wishlist-empty">
              <span>
                <Search size={24} aria-hidden="true" />
              </span>
              <h2>No shortlist matches</h2>
              <p>Try a different university, country, city, or program name.</p>
              <button type="button" onClick={() => setQuery("")}>
                Clear search
              </button>
            </section>
          ) : (
            <div className="wishlist-groups">
              {groupedUniversities.map((group) => (
                <section className="wishlist-group" key={group.label}>
                  <div className="wishlist-group-heading">
                    <h2>{group.label}</h2>
                    <span>{group.universities.length}</span>
                  </div>

                  <div className="wishlist-grid">
                    {group.universities.map((university) => {
                      const comparing = compareUniversityIds.includes(university.id);
                      const compareDisabled = !comparing && selectedCompareUniversities.length >= 3;
                      const note = universityNotes[university.id] ?? "";

                      return (
                        <article className="wishlist-card" key={university.id}>
                          <div className="wishlist-card-media">
                            <img
                              src={university.image}
                              alt={university.name + " campus"}
                              onError={(event) => {
                                if (event.currentTarget.src !== campusImage) {
                                  event.currentTarget.src = campusImage;
                                }
                              }}
                            />
                            <span className="wishlist-match">{university.matchScore}% match</span>
                            <button
                              type="button"
                              onClick={() => removeUniversity(university)}
                              aria-label={"Remove " + university.name + " from wishlist"}
                              title="Remove from wishlist"
                            >
                              <Heart size={16} fill="currentColor" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="wishlist-card-body">
                            <div className="wishlist-location">
                              <span>
                                {countryCodes[university.country] ??
                                  university.country.slice(0, 2).toUpperCase()}
                              </span>
                              {university.city}, {university.country}
                            </div>
                            <h2>{university.name}</h2>
                            <p className="wishlist-program">{university.programs[0]}</p>

                            <dl className="wishlist-facts">
                              <div>
                                <dt>World rank</dt>
                                <dd>#{university.ranking}</dd>
                              </div>
                              <div>
                                <dt>Tuition</dt>
                                <dd>{formatTuition(university)}</dd>
                              </div>
                              <div>
                                <dt>IELTS</dt>
                                <dd>{university.ieltsMin} minimum</dd>
                              </div>
                              <div>
                                <dt>Scholarship</dt>
                                <dd>{university.scholarshipAvailable ? "Available" : "Not listed"}</dd>
                              </div>
                            </dl>

                            <label
                              className={
                                "wishlist-compare-check " +
                                (comparing ? "is-checked " : "") +
                                (compareDisabled ? "is-disabled" : "")
                              }
                            >
                              <input
                                type="checkbox"
                                checked={comparing}
                                disabled={compareDisabled}
                                onChange={() => toggleCompare(university)}
                              />
                              <span>
                                <GitCompare size={14} aria-hidden="true" />
                                {comparing ? "Added to comparison" : "Add to comparison"}
                              </span>
                            </label>

                            {editingNoteId === university.id ? (
                              <div className="wishlist-note-editor">
                                <label htmlFor={"note-" + university.id}>Private note</label>
                                <textarea
                                  id={"note-" + university.id}
                                  autoFocus
                                  value={noteDraft}
                                  maxLength={800}
                                  rows={3}
                                  onChange={(event) => setNoteDraft(event.target.value)}
                                  placeholder="Why is this university on your shortlist?"
                                />
                                <div>
                                  <span>{noteDraft.length}/800</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoteId(null);
                                      setNoteDraft("");
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button type="button" onClick={() => saveNote(university)}>
                                    Save note
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="wishlist-note-preview glass-interactive"
                                onClick={() => beginNote(university)}
                              >
                                <StickyNote size={14} aria-hidden="true" />
                                <span>{note || "Add a private note"}</span>
                                <ChevronDown size={13} aria-hidden="true" />
                              </button>
                            )}

                            <div className="wishlist-card-actions">
                              <button
                                type="button"
                                className="glass-interactive"
                                onClick={() => navigate("/university/" + university.id)}
                              >
                                View details
                              </button>
                              <button type="button" onClick={() => navigate("/applications")}>
                                Start application
                                <ArrowRight size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : (
          <section className="wishlist-compare">
            <div className="wishlist-compare-heading">
              <div>
                <span className="wishlist-eyebrow">Side-by-side decision</span>
                <h2>Compare your strongest options</h2>
                <p>Select two or three saved universities to reveal the tradeoffs.</p>
              </div>
              {compareUniversityIds.length > 0 && (
                <button type="button" className="glass-interactive" onClick={clearCompareUniversities}>
                  <Trash2 size={14} aria-hidden="true" />
                  Clear selection
                </button>
              )}
            </div>

            <div className="wishlist-compare-picker" aria-label="Select universities to compare">
              {wishlistUniversities.map((university) => {
                const selected = compareUniversityIds.includes(university.id);
                const disabled = !selected && selectedCompareUniversities.length >= 3;

                return (
                  <label
                    className={(selected ? "is-selected " : "") + (disabled ? "is-disabled" : "")}
                    key={university.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => toggleCompare(university)}
                    />
                    <span>{countryCodes[university.country] ?? "UNI"}</span>
                    <strong>{university.name}</strong>
                    {selected && <Check size={14} aria-hidden="true" />}
                  </label>
                );
              })}
            </div>

            {selectedCompareUniversities.length < 2 ? (
              <div className="wishlist-compare-empty">
                <GitCompare size={22} aria-hidden="true" />
                <h3>Select at least two universities</h3>
                <p>Your comparison can include up to three saved options.</p>
              </div>
            ) : (
              <>
                <div className="wishlist-compare-table-wrap">
                  <table className="wishlist-compare-table">
                    <thead>
                      <tr>
                        <th scope="col">Criteria</th>
                        {selectedCompareUniversities.map((university) => (
                          <th scope="col" key={university.id}>
                            <span>{countryCodes[university.country] ?? "UNI"}</span>
                            <strong>{university.name}</strong>
                            <button
                              type="button"
                              onClick={() => toggleUniversityCompare(university.id)}
                              aria-label={"Remove " + university.name + " from comparison"}
                              title="Remove from comparison"
                            >
                              <X size={13} aria-hidden="true" />
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.label}>
                          <th scope="row">{row.label}</th>
                          {selectedCompareUniversities.map((university) => (
                            <td key={university.id}>{row.render(university)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="wishlist-compare-mobile">
                  {selectedCompareUniversities.map((university) => (
                    <article key={university.id}>
                      <div>
                        <span>{countryCodes[university.country] ?? "UNI"}</span>
                        <h3>{university.name}</h3>
                        <button
                          type="button"
                          onClick={() => toggleUniversityCompare(university.id)}
                          aria-label={"Remove " + university.name + " from comparison"}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <dl>
                        {comparisonRows.map((row) => (
                          <div key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>{row.render(university)}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        onClick={() => navigate("/university/" + university.id)}
                      >
                        View university
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
