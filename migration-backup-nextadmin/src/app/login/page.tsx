import Link from "next/link";
import { adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { LoginFormClient } from "@/components/admin/LoginFormClient";

const loginHighlights = [
  {
    title: "Product & catalog control",
    body: "Manage categories, launch products, stock visibility, and media links in one place.",
  },
  {
    title: "Order & payment review",
    body: "Check QR, card, and TrueMoney payment status before order fulfilment moves forward.",
  },
  {
    title: "Member growth operations",
    body: "Monitor point rules, referrals, commissions, and reward menus from the same dashboard.",
  },
];

export default function LoginPage() {
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <section className={styles.loginIntro}>
          <div>
            <span className={styles.loginBadge}>Beauty Up Enterprise</span>
            <h1 className={styles.loginTitle}>A calm green workspace for your backoffice team.</h1>
            <p className={styles.loginDescription}>
              Sign in to manage products, members, payments, orders, and reporting across the
              Beauty Up operations flow with a clear and premium interface.
            </p>
          </div>

          <ul className={styles.loginHighlight}>
            {loginHighlights.map((item) => (
              <li key={item.title} className={styles.loginItem}>
                <p className={styles.loginItemTitle}>{item.title}</p>
                <p className={styles.loginItemBody}>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.loginForm}>
          <p className={styles.eyebrow}>Admin Login</p>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formDescription}>
            Access the backoffice dashboard for Beauty Up Enterprise administration.
          </p>

          <LoginFormClient />

          <p className={styles.formDescription}>
            Need a quick preview first? <Link href="/">Open the dashboard prototype</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
