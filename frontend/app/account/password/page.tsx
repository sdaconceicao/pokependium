import ContentPanel from "@/components/ContentPanel";
import styles from "@/styles/narrowPage.module.css";
import ChangePasswordForm from "./components/ChangePasswordForm";

export const metadata = { title: "Change Password" };

export default function Page() {
  return (
    <ContentPanel className={styles.container}>
      <h1 className={styles.heading}>Change your password</h1>
      <ChangePasswordForm />
    </ContentPanel>
  );
}
