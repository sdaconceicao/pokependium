import ContentPanel from "@/components/ContentPanel";
import AccountProfile from "./components/AccountProfile";
import styles from "./page.module.css";

export const metadata = { title: "Your account" };

export default function Page() {
  return (
    <ContentPanel className={styles.container}>
      <AccountProfile />
    </ContentPanel>
  );
}
