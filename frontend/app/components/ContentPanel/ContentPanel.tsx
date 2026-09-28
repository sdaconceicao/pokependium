import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./ContentPanel.module.css";

interface ContentPanelProps {
  children: ReactNode;
  className?: string;
}

export const ContentPanel: React.FunctionComponent<ContentPanelProps> = ({
  children,
  className,
}) => <div className={clsx(styles.panel, className)}>{children}</div>;

export default ContentPanel;
