import {
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/service/supabase";
import Head from "next/head";
import { LuMail } from "react-icons/lu";

const ALLOWED_EMAIL_DOMAIN = "@kasamadigital.com";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSendMagicLink = async () => {
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Enter your email first.");
      return;
    }

    if (!trimmedEmail.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      setError(`Use your ${ALLOWED_EMAIL_DOMAIN} email address.`);
      return;
    }

    setIsSendingMagicLink(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: true,
      },
    });
    setIsSendingMagicLink(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEmail(trimmedEmail);
    setMagicLinkSent(true);
    setMessage("Magic link sent. Check your email to continue.");
  };

  if (isCheckingSession) {
    return (
      <Stack mx="auto" my="10%" w="280px" gap={4}>
        <Heading>Kasama Audits</Heading>
        <Text color="fg.subtle" fontSize="sm">
          Checking session...
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Head>
        <title>Sign in - Kasama Audits</title>
      </Head>
      <Stack mx="auto" py="2%" w="500px" gap={4}>
        <Heading>Kasama Audits</Heading>

        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field.HelperText>
            Enter your {ALLOWED_EMAIL_DOMAIN} email and we&apos;ll send a magic
            link so you can sign in without an OTP.
          </Field.HelperText>
        </Field.Root>

        <Button
          onClick={handleSendMagicLink}
          loading={isSendingMagicLink}
          disabled={isSendingMagicLink}
        >
          {magicLinkSent ? "Resend Magic Link" : "Send Magic Link"}
          <LuMail />
        </Button>

        {magicLinkSent ? (
          <Text color="fg.subtle" fontSize="sm">
            Open the email sent to {email} and tap the magic link to continue to
            your dashboard.
          </Text>
        ) : null}

        {message ? (
          <Text color="fg.subtle" fontSize="xs">
            {message}
          </Text>
        ) : null}
        {error ? (
          <Text color="red.fg" fontSize="xs">
            {error}
          </Text>
        ) : null}
      </Stack>
    </>
  );
}
