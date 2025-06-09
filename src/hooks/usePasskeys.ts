import { useCallback, useState } from "react";
import type { Passkey } from "@/types/passkey";
import { getUserCredentialsAction } from "@/server/auth/webauthn/getUserCredentials";
import { deleteCredentialAction } from "@/server/auth/webauthn/deleteCredential";

/**
 * Custom React hook for managing user passkeys (WebAuthn credentials).
 *
 * Handles fetching, deleting, and state management for passkeys.
 * Returns passkey list, loading/deleting state, error, and handlers.
 *
 * @returns {
 *   passkeys: Passkey[],
 *   isLoading: boolean,
 *   deletingId: string | null,
 *   error: string | null,
 *   fetchPasskeys: () => Promise<Passkey[]>,
 *   deletePasskey: (id: string) => Promise<void>,
 *   setPasskeys: React.Dispatch<React.SetStateAction<Passkey[]>>
 * }
 *   Object containing passkey state and handlers for fetch/delete.
 */
export function usePasskeys() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPasskeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserCredentialsAction();
      if ("error" in result) {
        setPasskeys([]);
        setError(result.error || "Failed to fetch passkeys");
        return [];
      } else {
        const mapped = (result.credentials || []).map((pk) => ({
          ...pk,
          createdAt:
            typeof pk.createdAt === "string"
              ? pk.createdAt
              : pk.createdAt && typeof pk.createdAt.toISOString === "function"
              ? pk.createdAt.toISOString()
              : String(pk.createdAt),
        })) as Passkey[];
        setPasskeys(mapped);
        return mapped;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setPasskeys([]);
      setError(err.message || "Failed to fetch passkeys");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePasskey = useCallback(async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await deleteCredentialAction(id);
      if ("error" in res) {
        setError(res.error || "Failed to delete passkey");
        throw new Error(res.error || "Failed to delete passkey");
      }
      setPasskeys((prev) => prev.filter((pk) => pk.id !== id));
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message || "Failed to delete passkey");
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, []);

  return {
    passkeys,
    isLoading,
    deletingId,
    error,
    fetchPasskeys,
    deletePasskey,
    setPasskeys, // for manual update if needed
  };
}
