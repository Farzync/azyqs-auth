import { Metadata } from "next";
import UnauthorizedClient from "@/components/errors/401";

export const metadata: Metadata = {
  title: "401 - Unauthorized Access",
  description: "You are not authorized to view this page.",
};

export default function UnauthorizedPage() {
  return <UnauthorizedClient />;
}
