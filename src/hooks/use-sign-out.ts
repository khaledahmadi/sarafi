import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/i18n";
import { logout } from "@/lib/api/auth";
import { setTrustedDevice } from "@/lib/trusted-device";

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      setTrustedDevice(false);
      await logout();
      toast.success(t("auth.signedOut"));
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.signOutFailed"));
    } finally {
      setSigningOut(false);
    }
  }

  return { signOut, signingOut };
}
