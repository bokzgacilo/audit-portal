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
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!auditSlug) {
      return;
    }

    let isMounted = true;

    const loadAudit = async () => {
      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("slug", auditSlug)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setAudit(null);
        setLoadError(error.message);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setAudit(null);
        setIsLoading(false);
        return;
      }

      console.log("DATA", data);

      const mappedAudit = mapSupabaseAudit(data);
      setAudit(mappedAudit);
      setPassword("");
      setPasswordError(null);
      setIsUnlocked(!mappedAudit.password);
      setIsLoading(false);
    };

    loadAudit();

    return () => {
      isMounted = false;
    };
  }, [auditSlug]);

  const handleUnlock = (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setPasswordError(null);

    if (!audit) {
      return;
    }

    if (password === audit.password) {
      setIsUnlocked(true);
      setPassword("");
      return;
    }

    setPasswordError("Password does not match.");
  };

  return (
    <>
      <Head>
        <title>{audit ? audit.name : "Audit Viewer"}</title>
      </Head>
      <Stack minH="100vh" bg="bg.panel">
        {isLoading ? (
          <CenteredState>
            <Spinner size="lg" />
            <Text color="fg.subtle" fontSize="sm">
              Loading file...
            </Text>
          </CenteredState>
        ) : loadError ? (
          <CenteredState>
            <Heading size="md">Could not load file</Heading>
            <Text color="fg.subtle" fontSize="sm">
              {loadError}
            </Text>
          </CenteredState>
        ) : audit ? (
          isUnlocked ? (
            <AuditFileViewer audit={audit} />
          ) : (
            <CenteredState>
              <Stack
                as="form"
                gap={4}
                w="min(360px, calc(100vw - 32px))"
                onSubmit={handleUnlock}
              >
                <Box>
                  <Heading size="md">Password Required</Heading>
                  <Text color="fg.subtle" fontSize="sm">
                    Enter the audit password to view this file.
                  </Text>
                </Box>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button type="submit">Unlock</Button>
                {passwordError ? (
                  <Text color="red.fg" fontSize="sm">
                    {passwordError}
                  </Text>
                ) : null}
              </Stack>
            </CenteredState>
          )
        ) : (
          <CenteredState>
            <Heading size="md">File not found</Heading>
            <Text color="fg.subtle" fontSize="sm">
              The requested audit file does not exist.
            </Text>
          </CenteredState>
        )}
      </Stack>
    </>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      alignItems="center"
      gap={3}
      justifyContent="center"
      minH="100vh"
      p={4}
      textAlign="center"
    >
      {children}
    </Stack>
  );
}

function AuditFileViewer({ audit }: { audit: Audit }) {
  const format = audit.format.toLowerCase();

  if (format.includes("pdf")) {
    return (
      <iframe
        title={`${audit.name} PDF viewer`}
        src={audit.link}
        style={{ width: "100%", height: "100vh", border: 0 }}
      />
    );
  }

  if (format.includes("video")) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
        bg="black"
      >
        <video
          src={audit.link}
          controls
          style={{ width: "100%", maxHeight: "100vh", background: "black" }}
        >
          <track kind="captions" label="No captions available" />
        </video>
      </Box>
    );
  }

  console.log(audit)

  if (format.includes("html")) {
    return (
      <iframe
        srcDoc={audit.html_text}
        style={{ width: "100%", height: "100vh", border: 0 }}
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }

  return (
    <CenteredState>
      <Heading size="md">Unsupported file format</Heading>
      <Text color="fg.subtle" fontSize="sm">
        Open the file directly to view this audit.
      </Text>
      <Button asChild size="sm" variant="outline">
        <a href={audit.link} rel="noreferrer" target="_blank">
          <LuExternalLink />
          Open file
        </a>
      </Button>
    </CenteredState>
  );
}
