import Link from "next/link";
import { ReactNode } from "react";
import { getAdminSession } from "@/lib/auth-session.server";
import { navigationItems } from "@/lib/admin-data";
import { LogoutButton } from "@/components/admin/LogoutButton";
import styles from "./admin-shell.module.css";

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

export async function AdminShell({
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
      <div className="wrapper">
        <nav className="main-header navbar navbar-expand navbar-light">
          <ul className="navbar-nav">
            <li className="nav-item">
              <span className={`nav-link ${styles.navIcon}`}>
                <i className="bi bi-grid-1x2-fill" />
              </span>
            </li>
            <li className="nav-item d-none d-sm-inline-block">
              <span className="nav-link">Beauty Up Enterprise Admin</span>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-center">
            {badge ? (
              <li className="nav-item me-3">
                <span className="badge bg-success">{badge}</span>
              </li>
            ) : null}
            {session ? (
              <li className="nav-item">
                <span className={styles.navSession}>
                  {session.admin.email} · {session.admin.role}
                </span>
              </li>
            ) : null}
          </ul>
        </nav>

        <aside className="main-sidebar sidebar-dark-success elevation-4">
          <Link className={`brand-link ${styles.brandLink}`} href="/">
            <span className={styles.brandMark}>B</span>
            <span className="brand-text fw-semibold">Beauty Up</span>
          </Link>

          <div className="sidebar">
            <div className={styles.sidebarIntro}>
              <p className={styles.sidebarTitle}>Enterprise Admin</p>
              <p className={styles.sidebarCaption}>Backoffice for catalog, orders, members, and reports.</p>
            </div>

            <nav className="mt-3">
              <ul className="nav nav-pills nav-sidebar flex-column" data-accordion="false" role="menu">
                {navigationItems.map((item) => (
                  <li key={item.href} className="nav-item">
                    <Link className={`nav-link ${item.href === activeHref ? "active" : ""}`} href={item.href}>
                      <i className="nav-icon bi bi-circle-fill" />
                      <p>{item.label}</p>
                    </Link>
                  </li>
                ))}
              </ul>
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
          </div>
        </aside>

        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
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
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

export { styles as adminStyles };
