import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { generateAuthenticationOptionsAction } from "@/server/auth/webauthn/generateAuthenticationOptions";
import { verifyPasskeyAction } from "@/server/auth/webauthn/verifyPasskey";
import { authenticatePasskey } from "@/lib/auth/webauthnClient";
import { getProfile } from "@/server/user";
import { User } from "@/types/user";

/**
 * Custom React hook for handling passkey (WebAuthn) login flow.
 *
 * This hook manages the passkey login process, including generating authentication options,
 * handling authentication, verifying the response, updating user state, and navigation.
 *
 * @param {(user: User) => void} setUser - Callback to set the authenticated user in state.
 * @returns {{
 *   isPasskeyLoading: boolean;
 *   errorMsg: string;
 *   handlePasskeyLogin: () => Promise<void>;
 * }}
 *   Object containing loading state, error message, and the login handler function.
 */
export function usePasskeyLogin(setUser: (user: User) => void) {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const router = useRouter();

  const handlePasskeyLogin = async () => {
    setErrorMsg("");
    setIsPasskeyLoading(true);
    try {
      const optRes = await generateAuthenticationOptionsAction();

      if ("error" in optRes) {
        throw new Error(optRes.error || "Failed to get passkey options");
      }
      if (!optRes.success) throw new Error("Failed to get passkey options");

      const response = await authenticatePasskey(optRes.options);

      const verifyRes = await verifyPasskeyAction(response);

      if ("error" in verifyRes) {
        throw new Error(verifyRes.error || "Passkey authentication failed");
      }
      if (!verifyRes.success) throw new Error("Passkey authentication failed");

      const userProfile = await getProfile();
      if (userProfile) {
        setUser(userProfile);
        toast.success("Login with passkey successful!");
        router.push("/");
      } else {
        throw new Error("Failed to retrieve user profile");
      }
    } catch {
      setErrorMsg("Passkey login failed");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return {
    isPasskeyLoading,
    errorMsg,
    handlePasskeyLogin,
  };
}
