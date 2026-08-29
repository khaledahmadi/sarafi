import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logout } from "@/lib/api/auth";
import { setTrustedDevice } from "@/lib/trusted-device";

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      setTrustedDevice(false);
      await logout();
      toast.success("با موفقیت خارج شدید");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خروج انجام نشد");
    } finally {
      setSigningOut(false);
    }
  }

  return { signOut, signingOut };
}
