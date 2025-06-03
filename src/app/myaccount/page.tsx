export const metadata = {
  title: "My Account",
  description: "Manage your account settings and profile information.",
};
import ProfileClient from "@/app/myaccount/AccountClient";

export default function ProfilePage() {
  return <ProfileClient />;
}
