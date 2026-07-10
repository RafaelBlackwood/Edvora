import { ExternalLink } from "lucide-react";
import { getSafeExternalUrl } from "../lib/security";

type SafeExternalLinkProps = {
  allowedHosts?: readonly string[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  url: string;
};

export function SafeExternalLink({ allowedHosts, children, className, style, url }: SafeExternalLinkProps) {
  const safeUrl = getSafeExternalUrl(url, allowedHosts);

  if (!safeUrl) {
    return (
      <span className={className} style={{ ...style, opacity: 0.6 }}>
        {children}
      </span>
    );
  }

  return (
    <a className={className} href={safeUrl} rel="noopener noreferrer nofollow" style={style} target="_blank">
      {children}
      <ExternalLink size={14} />
    </a>
  );
}
