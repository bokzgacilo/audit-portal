import {
  Button,
  Field,
  Heading,
  Input,
  PinInput,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/service/supabase";
import Head from "next/head";
import { LuCheck, LuDoorClosed, LuKey } from "react-icons/lu";

const OTP_LENGTH = 8;
const OTP_INPUTS = [
  "otp-1",
  "otp-2",
  "otp-3",
  "otp-4",
  "otp-5",
  "otp-6",
  "otp-7",
  "otp-8",
];

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
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
        router.replace("/dashboard/audits");
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleGetOTP = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setIsSendingOtp(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });
    setIsSendingOtp(false);

    if (error) {
      setError(error.message);
      return;
    }

    setOtp("");
    setOtpSent(true);
    setMessage("OTP sent. Check your email.");
  };

  const handleSignIn = async () => {
    setError(null);
    setMessage(null);

    if (otp.length !== OTP_LENGTH) {
      setError("Enter the complete OTP.");
      return;
    }

    setIsSigningIn(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: "email",
    });
    setIsSigningIn(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
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
      <Stack mx="auto" py="5%" w="500px" gap={4}>
        <Heading>Kasama Audits</Heading>

        {!otpSent ? (
          <>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Field.HelperText>
                Enter kasama email to get OTP in order to sign in
              </Field.HelperText>
            </Field.Root>

            <Button
              onClick={handleGetOTP}
              loading={isSendingOtp}
              disabled={isSendingOtp}
            >
              Get OTP
              <LuKey />
            </Button>
          </>
        ) : (
          <>
            <Field.Root>
              <Field.Label>OTP</Field.Label>
              <PinInput.Root
                w="100%"
                justifyContent="space-between"
                otp
                type="numeric"
                value={otp.split("")}
                onValueChange={(details) => setOtp(details.valueAsString)}
              >
                <PinInput.HiddenInput />
                <PinInput.Control >
                  {OTP_INPUTS.map((key, index) => (
                    <PinInput.Input key={key} index={index} />
                  ))}
                </PinInput.Control>
              </PinInput.Root>
              <Field.HelperText>Enter the OTP sent to {email}</Field.HelperText>
            </Field.Root>

            <Button
              onClick={handleSignIn}
              loading={isSigningIn}
              disabled={isSigningIn}
            >
              Sign in
              <LuCheck />
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMessage(null);
                setError(null);
              }}
            >
              Use another email
            </Button>
          </>
        )}

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
