import type { ReactNode } from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-title">
        {title}
      </div>

      {children}
    </section>
  );
}
