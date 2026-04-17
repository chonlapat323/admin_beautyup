import Link from "next/link";
import { ReactNode } from "react";
import { getAdminSession } from "@/lib/auth-session.server";
import { navigationItems } from "@/lib/admin-data";
import { LogoutButton } from "@/components/admin/LogoutButton";
import styles from "./adminlte-theme.module.css";

type AdminShellProps = {
  activeHref: string;
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  children: ReactNode;
};

export async function AdminShellTheme({
  activeHref,
  eyebrow,
  title,
  description,
  badge,
  primaryAction,
  secondaryAction,
  children,
}: AdminShellProps) {
  const session = await getAdminSession();

  return (
    <div className={`app-adminlte ${styles.page}`}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.navIcon}>
            <i className="bi bi-grid-1x2-fill" />
          </span>
          <span className={styles.topbarTitle}>Beauty Up Enterprise Admin</span>
        </div>

        <div className={styles.topbarRight}>
          {badge ? <span className="badge bg-success">{badge}</span> : null}
          {session ? (
            <span className={styles.navSession}>
              {session.admin.email} {"·"} {session.admin.role}
            </span>
          ) : null}
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Link className={styles.brandLink} href="/">
            <span className={styles.brandMark}>B</span>
            <span className={styles.brandText}>Beauty Up</span>
          </Link>

          <div className={styles.sidebarIntro}>
            <p className={styles.sidebarTitle}>Enterprise Admin</p>
            <p className={styles.sidebarCaption}>
              Backoffice for catalog, orders, members, and reports.
            </p>
          </div>

          <nav className={styles.sidebarNav}>
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                className={`${styles.sidebarLink} ${item.href === activeHref ? styles.sidebarLinkActive : ""}`}
                href={item.href}
              >
                <i className={`bi bi-circle-fill ${styles.sidebarLinkIcon}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className={`card ${styles.sidebarCard}`}>
            <div className="card-body">
              <p className={styles.sidebarLabel}>Launch Target</p>
              <strong className={styles.sidebarValue}>31 August 2026</strong>
              <p className={styles.sidebarHint}>
                Weekly sprint delivery for admin, catalog, orders, payments, and reporting flow.
              </p>
              {session ? (
                <div className={styles.sessionBlock}>
                  <p className={styles.sessionEmail}>{session.admin.email}</p>
                  <p className={styles.sessionRole}>{session.admin.role}</p>
                  <LogoutButton />
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className={styles.content}>
          <div className={`card ${styles.hero}`}>
            <div className="card-body">
              <div className={styles.heroTop}>
                <div>
                  <p className={styles.eyebrow}>{eyebrow}</p>
                  <h1 className={styles.title}>{title}</h1>
                  <p className={styles.description}>{description}</p>
                </div>

                <div className={styles.heroActions}>
                  {primaryAction ? (
                    <Link className="btn btn-success" href={primaryAction.href}>
                      {primaryAction.label}
                    </Link>
                  ) : null}
                  {secondaryAction ? (
                    <Link className="btn btn-outline-success" href={secondaryAction.href}>
                      {secondaryAction.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.contentBody}>{children}</div>
        </main>
      </div>
    </div>
  );
}

export { styles as adminStyles };
