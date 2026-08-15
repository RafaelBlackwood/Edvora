import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";

function getUniversityLogoUrls(website: string) {
  if (!website) return [];

  try {
    const url = new URL(website);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];

    const domain = url.hostname.replace(/^www\./i, "");
    return domain
      ? [
          `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`,
          `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(
            url.origin,
          )}`,
        ]
      : [];
  } catch {
    return [];
  }
}

export function UniversityLogo({
  className = "",
  name,
  website,
}: {
  className?: string;
  name: string;
  website: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const logoUrls = useMemo(() => getUniversityLogoUrls(website), [website]);
  const logoUrl = logoUrls[sourceIndex] ?? "";

  useEffect(() => {
    setSourceIndex(0);
  }, [logoUrls]);

  return (
    <span
      className={`university-logo ${className}`.trim()}
      aria-label={`${name} logo`}
      role="img"
    >
      {logoUrl ? (
        <img
          key={logoUrl}
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setSourceIndex((current) => current + 1)}
        />
      ) : (
        <span className="university-logo-placeholder" aria-hidden="true">
          <Building2 size={20} strokeWidth={1.7} />
        </span>
      )}
    </span>
  );
}
