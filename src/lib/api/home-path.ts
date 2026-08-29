import type { AuthUser } from "@/lib/api/auth-store";

export function homePathForUser(user: AuthUser): "/dashboard" | "/" {
  const isStaff = user.roles.includes("admin") || user.roles.includes("staff");
  return isStaff ? "/dashboard" : "/";
}
