import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>The Pro Gym &copy; {new Date().getFullYear()} — Powered by Vinh</span>
    </footer>
  );
}
