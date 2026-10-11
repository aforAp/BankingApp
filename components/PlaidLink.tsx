"use client";

import Script from "next/script";
import {
  PlaidLinkOnSuccess,
  PlaidLinkOptions,
  usePlaidLink,
} from "react-plaid-link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createLinkToken,
  exchangePublicToken,
} from "@/app/api/auth/sign-in/route";
import { toast } from "sonner";
import { Button } from "./ui/button";

const PLAID_SCRIPT_URL =
  "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

const PlaidLink = ({ variant }: { variant?: "primary" | "ghost" }) => {
  const [token, setToken] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const linkTokenRequest = useRef<Promise<{ linkToken: string }> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const getLinkToken = async () => {
      try {
        linkTokenRequest.current ??= createLinkToken();
        const data = await linkTokenRequest.current;
        if (!cancelled) setToken(data.linkToken);
      } catch (error) {
        console.error("Failed to initialize Plaid Link:", error);
        if (!cancelled) {
          toast.error("Unable to connect to your bank right now.", {
            position: "top-right",
          });
        }
      }
    };

    getLinkToken();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Script
        id="plaid-link"
        src={PLAID_SCRIPT_URL}
        onReady={() => setScriptReady(true)}
        onError={() => {
          toast.error("Unable to load the bank connection service.", {
            position: "top-right",
          });
        }}
      />
      {token && scriptReady && (
        <PlaidLinkButton token={token} variant={variant} />
      )}
    </>
  );
};

const PlaidLinkButton = ({
  token,
  variant,
}: {
  token: string;
  variant?: "primary" | "ghost";
}) => {
  const router = useRouter();

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken) => {
    try {
      await exchangePublicToken({ publicToken });
      toast.success("Bank connected successfully.", { position: "top-right" });
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to finish connecting the bank:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to finish connecting your bank. Please try again.",
        { position: "top-right" },
      );
    }
  }, [router]);

  const config: PlaidLinkOptions = { token, onSuccess };
  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      onClick={() => open()}
      disabled={!ready}
      className={variant === "primary" ? "plaidlink-primary" : "plaidlink-ghost"}
    >
      Connect Bank
    </Button>
  );
};

export default PlaidLink;
