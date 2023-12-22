import { useNavigate } from "react-router-dom";
import { AuthStore, useAuthStore } from "./use-auth-store";
import { api } from "../configs/api";

type UseSessionReturn = {
  user: AuthStore["user"];
  status: AuthStore["status"];
  refresh: () => void;
  signOut: () => Promise<void>;
};

export function useSession(): UseSessionReturn {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const signOutMutation = api.auth.logout.useMutation({
    onSuccess() {
      authStore.clear();
      navigate("/");
    },
  });

  const meQuery = api.auth.me.useQuery(["me"], undefined, {
    enabled: authStore.user === null,
    refetchOnWindowFocus: false,
    retry(failureCount, error) {
      return error.status !== 403 && failureCount < 3;
    },
    onError(error) {
      if (error.status === 403) {
        authStore.clear();
        navigate("/");
      }
    },
    onSuccess(res) {
      authStore.set({
        status: "authenticated",
        user: res.body,
      });
    },
  });

  return {
    user: authStore.user,
    status: authStore.status,
    refresh: () => meQuery.refetch(),
    async signOut() {
      await signOutMutation.mutateAsync({
        body: null,
      });
    },
  };
}
