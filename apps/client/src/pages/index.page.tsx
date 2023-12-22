import React from "react";
import { signInWithGoogle } from "../lib/configs/firebase-config";
import { api } from "../lib/configs/api";
import { useAuthStore } from "../lib/hooks/use-auth-store";
import { useNavigate } from "react-router-dom";
import { useSession } from "../lib/hooks/use-session";

export const HomePage: React.FC = () => {
  const session = useSession();
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const loginMutation = api.auth.login.useMutation({
    onSuccess(data) {
      authStore.set({
        status: "authenticated",
        user: data.body,
      });
      navigate("/dashboard");
    },
  });

  async function handleSignIn(): Promise<void> {
    try {
      const userCredentials = await signInWithGoogle();
      const accessToken = await userCredentials.user.getIdToken();
      await loginMutation.mutateAsync({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        body: null,
      });
    } catch (error: unknown) {
      console.error(error);
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          void handleSignIn();
        }}
        disabled={
          session.status === "loading" || session.status === "authenticated"
        }
      >
        {session.status === "loading"
          ? "Loading..."
          : session.status === "authenticated"
          ? "Signed In"
          : "Sign In"}
      </button>
    </div>
  );
};
