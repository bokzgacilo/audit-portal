import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  IconButton,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useState } from "react";
import { LuChevronLeft, LuEye, LuEyeOff } from "react-icons/lu";
import { supabase } from "@/service/supabase";

const FORMAT_OPTIONS = ["html", "pdf", "video"] as const;
type AuditFormat = (typeof FORMAT_OPTIONS)[number];

const FILE_ACCEPT_BY_FORMAT = {
  html: ".html,.htm,text/html",
  pdf: ".pdf,application/pdf",
  video: "video/*",
};

const createSlug = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "audit"}-${Date.now()}`;
};

const createSafeFileName = (fileName: string) =>
  fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CreateAuditPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<AuditFormat>("html");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim() || !type.trim()) {
      setError("Name and type are required.");
      return;
    }

    if (!file) {
      setError("Upload a file before creating the audit.");
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsCreating(true);

    const slug = createSlug(name);
    const fileName = createSafeFileName(file.name) || `${slug}.${format}`;
    const filePath = `${format}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("audits")
      .upload(filePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setIsCreating(false);
      return;
    }

    const { data: storage_data } = supabase.storage.from("audits").getPublicUrl(filePath);

    const { data, error: insertError } = await supabase
      .from("audits")
      .insert({
        name: name.trim(),
        type: type.trim(),
        format,
        // tags: tags.trim(),
        password,
        slug,
        link: storage_data.publicUrl,
        file_path: filePath,
      })
      .select("id")
      .single();

    if (insertError) {
      await supabase.storage.from("audits").remove([filePath]);
      setError(insertError.message);
      setIsCreating(false);
      return;
    }

    setMessage("Audit created.");
    setIsCreating(false);
    router.push(`/dashboard/audits`);
  };

  return (
    <Stack as="form" p={4} gap={4} mx="auto" onSubmit={handleSubmit}>
      <Flex alignItems="center" gap={4}>
        <IconButton
          onClick={() => router.push("/dashboard/audits/")}
          size="xs"
          variant="outline"
          aria-label="Back to audits"
        >
          <LuChevronLeft />
        </IconButton>
        <Heading size="lg">Create Audit</Heading>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Type</Field.Label>
            <Input
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            />
          </Field.Root>

          {/* <Field.Root>
            <Field.Label>Tags</Field.Label>
            <Textarea
              name="tags"
              autoresize
              minH="120px"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </Field.Root> */}

          <Field.Root>
            <Field.Label>Password</Field.Label>
            <Box position="relative" w="full">
              <Input
                name="password"
                pr={10}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                position="absolute"
                right={1}
                size="xs"
                top="50%"
                transform="translateY(-50%)"
                variant="ghost"
              >
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </IconButton>
            </Box>
          </Field.Root>

          <Field.Root>
            <Field.Label>Repeat Password</Field.Label>
            <Box position="relative" w="full">
              <Input
                name="repeatPassword"
                pr={10}
                type={showRepeatPassword ? "text" : "password"}
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
              />
              <IconButton
                aria-label={
                  showRepeatPassword
                    ? "Hide repeat password"
                    : "Show repeat password"
                }
                onClick={() => setShowRepeatPassword((value) => !value)}
                position="absolute"
                right={1}
                size="xs"
                top="50%"
                transform="translateY(-50%)"
                variant="ghost"
              >
                {showRepeatPassword ? <LuEyeOff /> : <LuEye />}
              </IconButton>
            </Box>
          </Field.Root>

          <Button alignSelf="flex-start" type="submit" loading={isCreating}>
            Create audit
          </Button>
        </Stack>

        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Format</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as AuditFormat)
                }
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>

          <Field.Root>
            <Field.Label>Upload file</Field.Label>
            <Input
              name="file"
              type="file"
              accept={FILE_ACCEPT_BY_FORMAT[format]}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field.Root>

          <Text color="fg.subtle" fontSize="sm">
            File uploads to audits/{format}/ before the table record is created.
          </Text>
        </Stack>
      </SimpleGrid>

      {message ? (
        <Text color="fg.subtle" fontSize="sm">
          {message}
        </Text>
      ) : null}
      {error ? (
        <Text color="red.fg" fontSize="sm">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
