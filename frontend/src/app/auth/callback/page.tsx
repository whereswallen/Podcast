"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Authentication failed: ${errorParam.replace(/_/g, " ")}`);
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    if (token) {
      handleOAuthCallback(token)
        .then(() => router.push("/dashboard"))
        .catch(() => {
          setError("Failed to complete authentication.");
          setTimeout(() => router.push("/login"), 3000);
        });
    } else {
      setError("No authentication token received.");
      setTimeout(() => router.push("/login"), 3000);
    }
  }, [searchParams, handleOAuthCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Completing authentication...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
