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
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!auditSlug) {
      return;
    }

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
        } else {
          setStatus("found")
        }
      } else {
        setStatus("not-found")
      }
    }
    checkIfExistingAudit()
  }, [auditSlug]);

  const handleUnlock = async () => {
    if (!auditSlug || !password) return;

    const { data, error } = await supabase
      .from("audits")
      .select("html_text, name")
      .eq("slug", auditSlug)
      .eq("password", password) // 👈 match BOTH
      .maybeSingle();

    if (error) {
      setPasswordError(error.message);
      return;
    }

    if (!data) {
      setPasswordError("Invalid password");
      return;
    }

    setHtmlContent(data.html_text)
    setTitle(data.name)
    setIsUnlocked(true);
    setPassword("");
    setStatus("unlocked")
  };

  const pageTitle = useMemo(() => {
    if (status === "loading") return "Kasama Audits";
    if (status === "expired") return "Audit Expired | Kasama";
    if (status === "not-found") return "Audit Not Found | Kasama";
    if (status === "found" && !isUnlocked) return "Protected Audit | Kasama";
    if (status === "unlocked" && title) return title;
    return "Kasama Audits";
  }, [status, isUnlocked, title]);

  const renderContent = () => {
    if (status === "loading") {
      return (
        <Stack h="100vh" alignItems="center" justifyContent="center">
          <Spinner size="lg" />
          <Text color="fg.subtle" fontSize="sm">
            Loading file...
          </Text>
        </Stack>
      );
    }

    if (status === "expired") {
      return (
        <Stack h="100vh" alignItems="center" justifyContent="center">
          <Heading size="md">Audit expired</Heading>
          <Text color="fg.subtle" fontSize="sm">
            The requested audit has expired. Please contact the auditor for access.
          </Text>
        </Stack>
      );
    }

    if (status === "not-found") {
      return (
        <Stack h="100vh" alignItems="center" justifyContent="center">
          <Heading size="md">Audit not found</Heading>
          <Text color="fg.subtle" fontSize="sm">
            The requested audit does not exist.
          </Text>
        </Stack>
      );
    }

    if (status === "found" && !isUnlocked) {
      return (
        <Stack py="5%" w="100vw" alignItems="center" justifyContent="center">
          <Stack gap={4} w="100%" maxW="500px">
            <Heading size="md">Password Required</Heading>
            <Text color="fg.subtle" fontSize="sm">
              Enter the audit password to view this file.
            </Text>

            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleUnlock();
              }}
            />

            <Button onClick={handleUnlock}>Unlock</Button>

            {passwordError && (
              <Text color="red.fg" fontSize="sm">
                {passwordError}
              </Text>
            )}
          </Stack>
        </Stack>
      );
    }

    if (status === "unlocked" && isUnlocked) {
      return (
        <iframe
          title={pageTitle}
          srcDoc={htmlContent ?? undefined}
          style={{ width: "100vw", height: "100vh", border: 0 }}
        />
      );
    }

    return null;
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Box
        position="fixed"
        bottom="0"
        left="0"
        width="100%"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        px={6}
        py={3}
        zIndex={9999}
        display={!isUnlocked ? "none" : "flex"}
        alignItems="center"
        justifyContent="space-between"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <img
            src="/logo.png"
            alt="Kasama"
            style={{ height: "24px", width: "auto" }}
          />
          <Text fontWeight="bold" fontSize="sm">
            Kasama Audits
          </Text>
        </Box>

        <Text fontSize="xs" color="gray.500">
          Confidential Audit Report
        </Text>
      </Box>
      {renderContent()}
    </>
  );
}
