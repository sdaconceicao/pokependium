import { Suspense } from "react";
import ContentPanel from "@/components/ContentPanel";
import styles from "@/styles/narrowPage.module.css";
import ResetPasswordForm from "./components/ResetPasswordForm";

export const metadata = { title: "Reset Password" };

export default function Page() {
  return (
    <ContentPanel className={styles.container}>
      <h1 className={styles.heading}>Choose a new password</h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </ContentPanel>
  );
}
