import type { ThreatLink } from "../../api/types";

import "./ExtractedLinks.css";

interface ExtractedLinksProps {
  links: ThreatLink[];
}

function getLinkFlags(link: ThreatLink): string[] {
  const flags: string[] = [];

  if (link.shortener) {
    flags.push("URL shortener");
  }

  if (link.ip_address) {
    flags.push("IP address");
  }

  if (link.suspicious_path) {
    flags.push("Suspicious path");
  }

  return flags;
}

export function ExtractedLinks({
  links,
}: ExtractedLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section
      className="extracted-links"
      aria-labelledby="extracted-links-title"
    >
      <div className="extracted-links__header">
        <div>
          <p className="extracted-links__eyebrow">
            Extracted artifacts
          </p>

          <h3 id="extracted-links-title">Links in message</h3>
        </div>

        <span className="extracted-links__count">
          {links.length}
        </span>
      </div>

      <ul className="extracted-links__list">
        {links.map((link, index) => {
          const flags = getLinkFlags(link);

          return (
            <li className="extracted-links__item" key={`${link.url}-${index}`}>
              <a
                className="extracted-links__url"
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                title={`Open ${link.url} in a new tab`}
              >
                {link.url}
              </a>

              <div className="extracted-links__metadata">
                <span className="extracted-links__host">
                  Host: <code>{link.host}</code>
                </span>

                {flags.length > 0 && (
                  <ul
                    className="extracted-links__flags"
                    aria-label="Link indicators"
                  >
                    {flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                )}

                {flags.length === 0 && (
                  <span className="extracted-links__clean">
                    No link indicators returned
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="extracted-links__warning">
        Do not open extracted links unless you have independently verified
        the sender and destination.
      </p>
    </section>
  );
}