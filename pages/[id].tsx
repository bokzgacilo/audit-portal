import {
  Box,
  Button,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { LuExternalLink } from "react-icons/lu";
import { type Audit, mapSupabaseAudit } from "@/lib/audits";
import { supabase } from "@/service/supabase";

export default function PublicAuditPage() {
  const router = useRouter();
  const auditSlug = useMemo(() => {
    const id = router.query.id;
    return Array.isArray(id) ? id[0] : id;
  }, [router.query.id]);

  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not-found" | "unlocked" | "expired">("loading")
  const [htmlContent, setHtmlContent] = useState<string | null>(null)

  useEffect(() => {
    if (!auditSlug) {
      return;
    }

    let isMounted = true;

    const checkIfExistingAudit = async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('slug, expires_at')
        .eq('slug', auditSlug)
        .maybeSingle();
      if (error) {
        console.error(error);
        setStatus("not-found")
        return;
      }

      if (data) {
        if (new Date(data.expires_at) < new Date()) {
          setStatus("expired")
        }
        setStatus("found")
      } else {
        setStatus("not-found")
      }
    }
    checkIfExistingAudit()
    return () => {
      isMounted = false;
    };
  }, [auditSlug]);

  const handleUnlock = async () => {
    if (!auditSlug || !password) return;

    const { data, error } = await supabase
      .from("audits")
      .select("html_text")
      .eq("slug", auditSlug)
      .eq("password", password) // 👈 match BOTH
      .single();

    if (error) {
      setPasswordError(error.message);
      return;
    }

    if (!data) {
      setPasswordError("Invalid password");
      return;
    }

    setHtmlContent(data.html_text)
    setIsUnlocked(true);
    setPassword("");
    setStatus("unlocked")
  };

  if (status === "loading") {
    return (
      <Stack
        h={"100vh"}
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="lg" />
        <Text color="fg.subtle" fontSize="sm">
          Loading file...
        </Text>
      </Stack>
    )
  }

  if (status === "expired") {
    return (
      <Stack
        h={"100vh"}
        alignItems="center"
        justifyContent="center"
      >
        <Heading size="md">Audit expired</Heading>
        <Text color="fg.subtle" fontSize="sm">
          The requested audit has expired.
          Please contact the auditor for access.
        </Text>
      </Stack>
    )
  }

  if (status === "not-found") {
    return (
      <Stack
        h={"100vh"}
        alignItems="center"
        justifyContent="center"
      >
        <Heading size="md">Audit not found</Heading>
        <Text color="fg.subtle" fontSize="sm">
          The requested audit does not exist.
        </Text>
      </Stack>
    )
  }

  if (status === "found" && !isUnlocked) {
    return (
      <Stack
        py="5%"
        w="100vw"
        alignItems="center"
        justifyContent="center"
        gap={0}
      >
        <Stack
          gap={4}
          w="100%"
          maxW="500px"
        >
          <Heading size="md">Password Required</Heading>
          <Text color="fg.subtle" fontSize="sm">
            Enter the audit password to view this file.
          </Text>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button onClick={() => handleUnlock()}>Unlock</Button>
          {passwordError ? (
            <Text color="red.fg" fontSize="sm">
              {passwordError}
            </Text>
          ) : null}
        </Stack>
      </Stack>
    )
  }

  if (status === "unlocked" && isUnlocked) {
    return (
      <iframe
        srcDoc={htmlContent ?? undefined}
        style={{ width: "100vw", height: "100vh", border: 0 }}
      />
    )
  }
}
