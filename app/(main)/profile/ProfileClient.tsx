"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function ProfileClient() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        }
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isLoggingOut}
        className="nc-btn-secondary"
        style={{
          padding: "12px 24px",
          color: "var(--red-600)",
          borderColor: "var(--red-200)",
          opacity: isLoggingOut ? 0.7 : 1,
          cursor: isLoggingOut ? "wait" : "pointer"
        }}
      >
        <ArrowLeftOnRectangleIcon className="w-[18px] h-[18px] mr-2 inline-block" />
        {isLoggingOut ? "Signing out..." : "Sign Out"}
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out from your account?"
        confirmText="Sign Out"
        isLoading={isLoggingOut}
        variant="primary"
      />
    </>
  );
}
