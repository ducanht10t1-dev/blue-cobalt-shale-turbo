import { createFileRoute } from "@tanstack/react-router";
import { WorkbookApp } from "@/components/workbook/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <WorkbookApp />;
}
