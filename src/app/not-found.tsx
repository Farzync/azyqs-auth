import { Metadata } from "next";
import NotFoundClient from "@/components/errors/404";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return <NotFoundClient />;
}
