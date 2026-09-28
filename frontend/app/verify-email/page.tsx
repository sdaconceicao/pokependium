import { Suspense } from "react";
import ContentPanel from "@/components/ContentPanel";
import styles from "@/styles/narrowPage.module.css";
import VerifyEmailForm from "./components/VerifyEmailForm";

export const metadata = { title: "Verify Email" };

export default function Page() {
  return (
    <ContentPanel className={styles.container}>
      <h1 className={styles.heading}>Verifying your account</h1>
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </ContentPanel>
  );
}
