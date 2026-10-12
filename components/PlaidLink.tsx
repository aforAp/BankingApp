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
  createTransactionsUpdateLinkToken,
  exchangePublicToken,
} from "@/app/api/auth/sign-in/route";
import { toast } from "sonner";
import { Button } from "./ui/button";

const PLAID_SCRIPT_URL =
  "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

const PlaidLink = ({
  variant,
  accountId,
}: {
  variant?: "primary" | "ghost";
  accountId?: string;
}) => {
  const [token, setToken] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const linkTokenRequest = useRef<Promise<{ linkToken: string }> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const getLinkToken = async () => {
      try {
        linkTokenRequest.current ??= accountId
          ? createTransactionsUpdateLinkToken({ accountId })
          : createLinkToken();
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
  }, [accountId]);

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
        <PlaidLinkButton token={token} variant={variant} accountId={accountId} />
      )}
    </>
  );
};

const PlaidLinkButton = ({
  token,
  variant,
  accountId,
}: {
  token: string;
  variant?: "primary" | "ghost";
  accountId?: string;
}) => {
  const router = useRouter();

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken) => {
    try {
      if (accountId) {
        toast.success("Bank permissions updated.", { position: "top-right" });
      } else {
        if (!publicToken) {
          throw new Error("Plaid did not return a public token.");
        }
        await exchangePublicToken({ publicToken });
        toast.success("Bank connected successfully.", { position: "top-right" });
      }
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
  }, [accountId, router]);

  const config: PlaidLinkOptions = { token, onSuccess };
  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      onClick={() => open()}
      disabled={!ready}
      className={variant === "primary" ? "plaidlink-primary" : "plaidlink-ghost"}
    >
      {accountId ? "Grant Transactions Access" : "Connect Bank"}
    </Button>
  );
};

export default PlaidLink;
