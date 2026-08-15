import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  GitCompare,
  Globe,
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import campusImage from "../../../assets/edvora-campus.jpg";
import { curatedInstitutionIds } from "../../data/curatedInstitutions";
import { universities } from "../../data/mockData";
import { getUniversitySourceData } from "../../data/universitySourceData";
import {
  useCatalogInstitutionDetail,
  useUniversityCatalog,
  type CatalogInstitution,
  type CatalogManifest,
} from "../../hooks/useUniversityCatalog";
import { useAppData } from "../../providers/AppDataProvider";
import { SafeExternalLink } from "../SafeExternalLink";
import { UniversityLogo } from "../UniversityLogo";
import { UniversityProgramDirectory } from "../UniversityProgramDirectory";
import { UniversityRequirementsDirectory } from "../UniversityRequirementsDirectory";

const tabs = ["Overview", "Programs", "Requirements", "Costs", "Scholarships", "Application Guide"];


const appGuideSteps = [
  { step: 1, title: "Choose Program", desc: "Browse and select your target program with our smart search." },
  { step: 2, title: "Check Requirements", desc: "Review GPA, language scores, and document requirements." },
  { step: 3, title: "Prepare Documents", desc: "Upload transcripts, CV, motivation letter, and references." },
  { step: 4, title: "Fill Application Form", desc: "Complete your personal, academic, and professional details." },
  { step: 5, title: "Submit Application", desc: "Submit directly via Edvora or export a PDF package." },
  { step: 6, title: "Apply for Scholarship", desc: "Simultaneously apply for available scholarships." },
  { step: 7, title: "Wait for Review", desc: "Track your application status in real time." },
  { step: 8, title: "Accept Offer", desc: "Confirm your place and begin visa preparation." },
];

function CatalogUniversityDetail({
  institution,
  manifest,
}: {
  institution: CatalogInstitution;
  manifest: CatalogManifest | null;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const {
    error: detailError,
    institution: fullInstitution,
    loading: detailLoading,
  } = useCatalogInstitutionDetail(institution);
  const location = [institution.city, institution.region, institution.country]
    .filter(Boolean)
    .join(", ");
  const domains = fullInstitution?.domains ?? [];
  const coordinates = fullInstitution?.coordinates;
  const recordUpdated = fullInstitution?.source.recordUpdated;
  const applicationId = "ror-" + institution.id.split("/").pop();

  const pendingPanels: Record<string, { title: string; description: string }> = {
    Costs: {
      title: "Current costs are not published in Edvora yet",
      description:
        "Tuition, mandatory fees, application charges, and living costs can change by program, citizenship, campus, and academic year. Use the official university site until a reviewed snapshot is available.",
    },
    Scholarships: {
      title: "Funding records are being verified",
      description:
        "Scholarships, grants, fellowships, assistantships, and waivers are offer-specific. Edvora will not show generic funding claims as if they applied to every applicant.",
    },
  };

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <header className="relative h-64 overflow-hidden">
        <img
          src={campusImage}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.38) saturate(0.7)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,13,26,0.16) 0%, rgba(8,13,26,0.88) 78%, #080d1a 100%)",
          }}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 lg:left-8 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm hover:bg-white/10"
          style={{ background: "rgba(0,0,0,0.4)", color: "#b4bfd2" }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </button>

        <div className="absolute left-4 right-4 bottom-6 lg:left-8 lg:right-8 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4 min-w-0">
            <UniversityLogo
              className="is-profile"
              name={institution.name}
              website={institution.website}
            />
            <div className="min-w-0">
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ color: "#9ca8ff" }}
              >
                Verified education institution
              </span>
              <h1
                className="text-xl sm:text-2xl font-bold text-white leading-tight mt-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {institution.name}
              </h1>
              <p
                className="flex items-center gap-1.5 text-xs sm:text-sm mt-1"
                style={{ color: "#a8b4d0" }}
              >
                <MapPin size={12} aria-hidden="true" />
                {location}
              </p>
            </div>
          </div>
          {institution.website && (
            <SafeExternalLink
              url={institution.website}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs glass-interactive"
              style={{ color: "#d3d7ff" }}
            >
              Official website
            </SafeExternalLink>
          )}
        </div>
      </header>

      <div
        style={{
          borderBottom: "1px solid rgba(124,106,247,0.12)",
          background: "rgba(8,13,26,0.92)",
          backdropFilter: "blur(12px)",
        }}
        className="sticky top-0 z-10 px-4 lg:px-8"
      >
        <div className="flex overflow-x-auto gap-1 -mb-px scrollbar-none">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2"
              style={{
                borderBottomColor: activeTab === tab ? "#7c6af7" : "transparent",
                color: activeTab === tab ? "#a89bf5" : "#6b7a9e",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3"
          style={{
            background: "rgba(42, 111, 88, 0.12)",
            border: "1px solid rgba(76, 175, 135, 0.24)",
          }}
        >
          <span className="text-xs font-medium" style={{ color: "#a9d8c5" }}>
            Institution identity verified through the current ROR release
          </span>
          <span className="text-xs" style={{ color: "#7d9f92" }}>
            {detailLoading
              ? "Loading full record..."
              : recordUpdated
                ? "Record updated " + recordUpdated
                : "Release " + (manifest?.source.publicationDate ?? "current")}
          </span>
        </div>

        {activeTab === "Overview" && (
          <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.72fr)] gap-5">
            <div className="space-y-4">
              <section
                className="p-5 rounded-lg"
                style={{
                  background: "rgba(13,20,50,0.6)",
                  border: "1px solid rgba(124,106,247,0.12)",
                }}
              >
                <h2 className="font-semibold text-white">Institution profile</h2>
                <p className="text-sm leading-relaxed mt-3" style={{ color: "#a8b4d0" }}>
                  {institution.name} is an active education institution in the
                  Research Organization Registry. The names, location, founding year,
                  domains, coordinates, and registry provenance shown here come from
                  the current Edvora catalog release.
                </p>

                {institution.aliases.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-xs font-semibold text-white">Names and aliases</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {institution.aliases.slice(0, 12).map((alias) => (
                        <span
                          key={alias}
                          className="px-2.5 py-1.5 rounded-md text-xs"
                          style={{
                            background: "rgba(124,106,247,0.1)",
                            border: "1px solid rgba(124,106,247,0.18)",
                            color: "#aaa3ef",
                          }}
                        >
                          {alias}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {domains.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-xs font-semibold text-white">Verified domains</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {domains.map((domain) => (
                        <span
                          key={domain}
                          className="px-2.5 py-1.5 rounded-md text-xs"
                          style={{
                            background: "rgba(38,118,137,0.12)",
                            border: "1px solid rgba(71,154,172,0.2)",
                            color: "#8fc4cf",
                          }}
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section
                className="p-5 rounded-lg"
                style={{
                  background: "rgba(13,20,50,0.6)",
                  border: "1px solid rgba(124,106,247,0.12)",
                }}
              >
                <h2 className="font-semibold text-white">Admissions data status</h2>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {[
                    ["Programs and degrees", "Published records appear in Programs"],
                    ["Entry requirements", "Awaiting program-level verification"],
                    ["Tuition and funding", "Awaiting current official sources"],
                    ["Deadlines and intakes", "Awaiting program-level verification"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="p-3 rounded-md"
                      style={{ background: "rgba(8,13,26,0.5)" }}
                    >
                      <span className="block text-xs" style={{ color: "#7c899f" }}>
                        {label}
                      </span>
                      <strong
                        className="block text-xs font-medium mt-1"
                        style={{ color: "#b4bfd0" }}
                      >
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section
                className="p-5 rounded-lg"
                style={{
                  background: "rgba(13,20,50,0.6)",
                  border: "1px solid rgba(124,106,247,0.12)",
                }}
              >
                <h2 className="font-semibold text-white">Verified facts</h2>
                <dl className="space-y-3 mt-4">
                  {[
                    [Globe, "Country", institution.country],
                    [MapPin, "City", institution.city || "Not listed"],
                    [MapPin, "Region", institution.region || "Not listed"],
                    [
                      CalendarDays,
                      "Established",
                      institution.established?.toString() || "Not listed",
                    ],
                    [
                      Database,
                      "Registry",
                      institution.id.replace("https://ror.org/", "ROR "),
                    ],
                    [
                      MapPin,
                      "Coordinates",
                      coordinates?.lat != null && coordinates.lng != null
                        ? coordinates.lat.toFixed(4) + ", " + coordinates.lng.toFixed(4)
                        : "Not listed",
                    ],
                  ].map(([Icon, label, value]) => {
                    const FactIcon = Icon as typeof Globe;
                    return (
                      <div key={label as string} className="flex items-center justify-between gap-4">
                        <dt className="flex items-center gap-2 text-xs" style={{ color: "#77859c" }}>
                          <FactIcon size={13} aria-hidden="true" />
                          {label as string}
                        </dt>
                        <dd
                          className="text-xs font-medium text-right"
                          style={{ color: "#d5dbe4" }}
                        >
                          {value as string}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>

              {detailError && (
                <p className="text-xs leading-relaxed" style={{ color: "#d2a764" }}>
                  {detailError}
                </p>
              )}

              {institution.website && (
                <SafeExternalLink
                  url={institution.website}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium hover:bg-white/5"
                  style={{
                    background: "rgba(124,106,247,0.1)",
                    border: "1px solid rgba(124,106,247,0.22)",
                    color: "#aaa3ef",
                  }}
                >
                  Official website
                </SafeExternalLink>
              )}

              <SafeExternalLink
                url={institution.id}
                className="flex items-center justify-center gap-2 text-xs hover:text-white"
                style={{ color: "#68768d" }}
              >
                Open registry record
              </SafeExternalLink>
            </aside>
          </div>
        )}

        {activeTab === "Programs" && (
          <UniversityProgramDirectory
            applicationUniversityId={applicationId}
            institutionId={institution.id}
            institutionName={institution.name}
            officialWebsite={institution.website}
          />
        )}

        {activeTab === "Requirements" && (
          <UniversityRequirementsDirectory
            institutionId={institution.id}
            institutionName={institution.name}
            officialWebsite={institution.website}
          />
        )}

        {pendingPanels[activeTab] && (
          <section
            className="p-5 rounded-lg"
            style={{
              background: "rgba(13,20,50,0.6)",
              border: "1px solid rgba(124,106,247,0.12)",
            }}
          >
            <h2 className="font-semibold text-white">{pendingPanels[activeTab].title}</h2>
            <p
              className="max-w-3xl text-sm leading-relaxed mt-3"
              style={{ color: "#a8b4d0" }}
            >
              {pendingPanels[activeTab].description}
            </p>
            {institution.website && (
              <SafeExternalLink
                url={institution.website}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md text-sm"
                style={{
                  background: "rgba(124,106,247,0.1)",
                  border: "1px solid rgba(124,106,247,0.22)",
                  color: "#aaa3ef",
                }}
              >
                Verify on official website
              </SafeExternalLink>
            )}
          </section>
        )}

        {activeTab === "Application Guide" && (
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {appGuideSteps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-4 p-4 rounded-lg"
                  style={{
                    background: "rgba(13,20,50,0.6)",
                    border: "1px solid rgba(124,106,247,0.12)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: "#665bd7", color: "white" }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{step.title}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6b7a9e" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/applications?new=1&university=" +
                      encodeURIComponent(applicationId),
                  )
                }
                className="px-8 py-3 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#665bd7" }}
              >
                Start application
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function UniversityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    error: catalogError,
    institutions,
    loading: catalogLoading,
    manifest,
  } = useUniversityCatalog();
  const {
    compareUniversityIds,
    isUniversitySaved,
    toggleUniversityCompare,
    toggleUniversitySave,
  } = useAppData();
  const [activeTab, setActiveTab] = useState("Overview");

  const uni = universities.find((university) => university.id === id);
  const catalogCode = id?.startsWith("ror-") ? id.slice(4) : "";
  const curatedInstitutionId = uni ? curatedInstitutionIds[uni.id] : undefined;
  const catalogInstitution = catalogCode
    ? institutions.find((institution) => institution.id.endsWith("/" + catalogCode))
    : uni
      ? institutions.find((institution) => {
          if (institution.id === curatedInstitutionId) return true;
          const names = [institution.name, ...institution.aliases].map((name) =>
            name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ""),
          );
          const targetName = uni.name
            .toLocaleLowerCase()
            .replace(/[^a-z0-9]+/g, "");
          return names.includes(targetName);
        })
      : undefined;
  const { institution: catalogDetail } =
    useCatalogInstitutionDetail(catalogInstitution);

  if (!uni) {
    if (catalogLoading) {
      return (
        <div
          className="min-h-full grid place-items-center p-6"
          style={{ background: "#080d1a", color: "#9aa6ba" }}
          aria-live="polite"
        >
          <div className="text-center">
            <Building2 size={26} className="mx-auto mb-3" style={{ color: "#8f84e8" }} />
            <p className="text-sm">Loading university profile...</p>
          </div>
        </div>
      );
    }

    if (catalogInstitution) {
      return (
        <CatalogUniversityDetail
          institution={catalogInstitution}
          manifest={manifest}
        />
      );
    }

    return (
      <div
        className="min-h-full grid place-items-center p-6"
        style={{ background: "#080d1a" }}
      >
        <div className="text-center max-w-sm">
          <Building2 size={28} className="mx-auto mb-3" style={{ color: "#7c6af7" }} />
          <h1 className="text-lg font-semibold text-white">University not found</h1>
          <p className="text-sm mt-2" style={{ color: "#7d899e" }}>
            {catalogError || "This institution is not present in the current catalog release."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="mt-5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#665bd7", color: "#ffffff" }}
          >
            Back to university search
          </button>
        </div>
      </div>
    );
  }

  const sourceData = getUniversitySourceData(uni.id);
  const saved = isUniversitySaved(uni.id);
  const comparing = compareUniversityIds.includes(uni.id);

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <img src={uni.image} alt={uni.name} className="w-full h-full object-cover" style={{ filter: "brightness(0.5)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,13,26,0.2) 0%, rgba(8,13,26,0.85) 80%, #080d1a 100%)" }} />

        <div className="absolute top-4 left-4 lg:left-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
            style={{ background: "rgba(0,0,0,0.4)", color: "#a8b4d0" }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <div className="absolute bottom-6 left-4 lg:left-8 right-4 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <UniversityLogo
              className="is-profile"
              name={uni.name}
              website={uni.website}
            />
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{uni.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm" style={{ color: "#a8b4d0" }}>
                  <MapPin size={12} /> {uni.city}, {uni.country}
                </span>
                <span className="flex items-center gap-1 text-sm" style={{ color: "#f59e0b" }}>
                  <Star size={12} /> #{uni.ranking} World
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleUniversitySave(uni.id)}
              className="glass-interactive w-10 h-10 flex items-center justify-center"
              style={{ color: saved ? "#ef6d75" : "#a8b4d0" }}
              aria-label={(saved ? "Remove " : "Save ") + uni.name}
              title={saved ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart size={16} fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => toggleUniversityCompare(uni.id)}
              disabled={!comparing && compareUniversityIds.length >= 3}
              className="glass-interactive w-10 h-10 flex items-center justify-center disabled:opacity-40"
              style={{ color: comparing ? "#a89bf5" : "#a8b4d0" }}
              aria-label={(comparing ? "Remove " : "Compare ") + uni.name}
              title={comparing ? "Remove from comparison" : "Add to comparison"}
            >
              <GitCompare size={16} />
            </button>
            <button
              onClick={() => navigate("/applications?new=1&university=" + uni.id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(124,106,247,0.12)", background: "rgba(8,13,26,0.8)", backdropFilter: "blur(12px)" }}
        className="sticky top-0 z-10 px-4 lg:px-8">
        <div className="flex overflow-x-auto gap-1 -mb-px scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2"
              style={{
                borderBottomColor: activeTab === tab ? "#7c6af7" : "transparent",
                color: activeTab === tab ? "#a89bf5" : "#6b7a9e",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        {sourceData && (
          <div
            className="mb-5 flex flex-col gap-1 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "rgba(42, 111, 88, 0.12)",
              border: "1px solid rgba(76, 175, 135, 0.24)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "#a9d8c5" }}>
              Official-source snapshot for {sourceData.scope}
            </span>
            <span className="text-xs" style={{ color: "#7d9f92" }}>
              Verified {sourceData.verifiedAt} - {sourceData.academicYear}
            </span>
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">About</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#a8b4d0" }}>{uni.description}</p>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">Key Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {uni.strengths.map((s) => (
                    <span key={s} className="px-3 py-1.5 rounded-full text-sm" style={{ background: "rgba(124,106,247,0.1)", color: "#a89bf5", border: "1px solid rgba(124,106,247,0.2)" }}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-1">Profiled program areas</h3>
                <p className="text-xs mb-3" style={{ color: "#6b7a9e" }}>
                  Confirm current availability and specialization names on the official program page.
                </p>
                <div className="space-y-2">
                  {uni.programs.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm" style={{ color: "#a8b4d0" }}>
                      <CheckCircle2 size={14} style={{ color: "#10b981" }} /> {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-4">At a Glance</h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: CalendarDays,
                      label: "Established",
                      value: catalogDetail?.established?.toString() ?? "See registry",
                    },
                    {
                      icon: Globe,
                      label: "Country",
                      value: catalogDetail?.country ?? uni.country,
                    },
                    {
                      icon: MapPin,
                      label: "Region",
                      value: catalogDetail?.region || uni.city,
                    },
                    {
                      icon: Database,
                      label: "Registry",
                      value:
                        catalogDetail?.id.replace("https://ror.org/", "ROR ") ??
                        "Loading",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7a9e" }}>
                        <Icon size={14} /> {label}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">Data quality</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["Cost cycle", sourceData?.academicYear ?? "Awaiting verification"],
                    ["Last verified", sourceData?.verifiedAt ?? "Not verified"],
                    [
                      "Registry record",
                      catalogDetail?.source.recordUpdated ?? "Loading current record",
                    ],
                    ["Admissions", "Program-specific"],
                    ["Deadlines", "Program-specific"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span style={{ color: "#6b7a9e" }}>{label}</span>
                      <span className="text-right" style={{ color: "#a8b4d0" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <a
                href={uni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", color: "#a89bf5" }}
              >
                <ExternalLink size={14} /> Official Website
              </a>
            </div>
          </div>
        )}

        {activeTab === "Programs" && (
          <UniversityProgramDirectory
            applicationUniversityId={uni.id}
            fallbackProgramNames={uni.programs}
            institutionId={catalogInstitution?.id ?? curatedInstitutionId}
            institutionName={uni.name}
            officialWebsite={uni.website}
          />
        )}

        {activeTab === "Requirements" && (
          <UniversityRequirementsDirectory
            institutionId={catalogInstitution?.id ?? curatedInstitutionId}
            institutionName={uni.name}
            officialWebsite={uni.website}
          />
        )}

        {activeTab === "Costs" && (
          sourceData ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Tuition",
                    value: sourceData.tuition.amountLabel,
                    detail: sourceData.tuition.context,
                  },
                  {
                    label: "Application fee",
                    value: sourceData.applicationFee.amountLabel,
                    detail: sourceData.applicationFee.context,
                  },
                  {
                    label: "Living costs",
                    value: sourceData.livingCosts.amountLabel,
                    detail: sourceData.livingCosts.context,
                  },
                ].map((item) => (
                  <section
                    key={item.label}
                    className="p-5 rounded-lg"
                    style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
                  >
                    <span className="text-xs font-semibold uppercase" style={{ color: "#77859c" }}>
                      {item.label}
                    </span>
                    <strong className="block mt-2 text-base text-white">{item.value}</strong>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "#98a5b8" }}>
                      {item.detail}
                    </p>
                  </section>
                ))}
              </div>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] gap-4">
                <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                  <h3 className="font-semibold text-white mb-3">What changes the final price</h3>
                  <div className="space-y-2">
                    {sourceData.notes.map((note) => (
                      <p key={note} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "#a8b4d0" }}>
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "#55b792" }} />
                        {note}
                      </p>
                    ))}
                  </div>
                </section>

                <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                  <h3 className="font-semibold text-white mb-3">Official sources</h3>
                  <div className="space-y-2">
                    {sourceData.sources.map((source) => (
                      <SafeExternalLink
                        key={source.url}
                        url={source.url}
                        className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/5"
                        style={{ border: "1px solid rgba(124,106,247,0.16)", color: "#aaa3ef" }}
                      >
                        {source.label}
                        <ExternalLink size={13} aria-hidden="true" />
                      </SafeExternalLink>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white">Cost data pending verification</h3>
              <p className="text-sm mt-2" style={{ color: "#8f9bb0" }}>
                Edvora will not estimate tuition or living costs without a current official source.
              </p>
            </section>
          )
        )}

        {activeTab === "Scholarships" && (
          <div className="grid md:grid-cols-2 gap-4">
            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-center gap-2">
                <Award size={17} style={{ color: "#e5b956" }} aria-hidden="true" />
                <h3 className="font-semibold text-white">Funding is offer-specific</h3>
              </div>
              <p className="text-sm leading-relaxed mt-3" style={{ color: "#a8b4d0" }}>
                Scholarships, assistantships, fellowships, and waivers depend on the program,
                citizenship, funding year, and admission offer. Edvora no longer shows generic
                scholarship names or amounts as if they applied to every university.
              </p>
              <button
                type="button"
                onClick={() => navigate("/scholarships")}
                className="mt-4 px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: "#665bd7", color: "#ffffff" }}
              >
                Search funding opportunities
              </button>
            </section>

            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-3">Verify with the university</h3>
              <div className="space-y-2">
                {(sourceData?.sources ?? []).map((source) => (
                  <SafeExternalLink
                    key={source.url}
                    url={source.url}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/5"
                    style={{ border: "1px solid rgba(124,106,247,0.16)", color: "#aaa3ef" }}
                  >
                    {source.label}
                    <ExternalLink size={13} aria-hidden="true" />
                  </SafeExternalLink>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Application Guide" && (
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {appGuideSteps.map((step, i) => (
                <div
                  key={step.step}
                  className="flex items-start gap-4 p-4 rounded-2xl transition-all"
                  style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)", color: "white" }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{step.title}</h4>
                    <p className="text-sm mt-0.5" style={{ color: "#6b7a9e" }}>{step.desc}</p>
                  </div>
                  {i < appGuideSteps.length - 1 && (
                    <div className="ml-4 mt-8 w-0.5 h-4 shrink-0" style={{ background: "rgba(124,106,247,0.2)" }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/applications?new=1&university=" + uni.id)}
                className="px-8 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
              >
                Start Your Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
