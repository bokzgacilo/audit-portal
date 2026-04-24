import { supabase } from "@/service/supabase";
import { Box, Button, CloseButton, DatePicker, DateValue, FileUpload, Flex, Heading, HStack, IconButton, Input, InputGroup, NativeSelect, parseDate, Portal, Stack, Text, useDatePicker, useFileUpload } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuCalendar, LuEye, LuEyeOff, LuFileUp, LuUpload } from "react-icons/lu";

const today = new Date();

const createSlug = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}`;
};

const isPastDate = (date: DateValue) => {
  const input = date.toDate("UTC")
  const now = new Date()
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ))

  return input < todayUTC
}

export default function CreateAuditForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [tags, setTags] = useState<string>("")
  const [format, setFormat] = useState<string>(".html,.htm,text/html")
  const [password, setPassword] = useState<string>("")
  const [repeatPassword, setRepeatPassword] = useState<string>("")
  const [showPasswords, setShowPasswords] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState([parseDate("2026-01-26")])
  const [file, setFile] = useState<File | null>(null);

  const handleCreateAudit = async () => {
    if (!file) return;
    if (!name.trim() || !type.trim()) return;

    if (password !== repeatPassword) {
      alert("password mismatch");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const timestamp = Date.now();
      const slug = createSlug(name);
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${slug}/${fileName}`;

      // 1. Upload file first
      const { error: uploadError } = await supabase.storage
        .from("audits")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        return;
      }

      // 2. Get public URL after successful upload
      const { data: publicUrlData } = supabase.storage
        .from("audits")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        console.error("No public URL returned");
        return;
      }

      // Optional: convert uploaded HTML file to text
      const htmlText = await file.text();

      // 3. Insert audit row only if public URL exists
      const { data, error: insertError } = await supabase
        .from("audits")
        .insert({
          name: name.trim(),
          type: type.trim(),
          format,
          tags: normalizedTags,
          password,
          expires_at: expiresAt.map((d) => d.toString()).join(", "),
          slug,
          html_text: htmlText,
          link: publicUrl,
          file_path: filePath,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError.message);
        return;
      }

      router.push(`/${slug}`);
    } catch (error) {
      console.error("Create audit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack
      gap={0}
      height="100%"
    >
      <Heading fontSize="16px">Metadata</Heading>
      <Flex
        py={2}
        alignItems="start"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" width="135px">Name</Text>
        <Stack flex={1}>
          <Input
            variant={name === "" ? "outline" : "subtle"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2023 Annual Audit"
            size="sm"
          />
          <Text fontSize="xs">{`${process.env.NEXT_PUBLIC_BASE_URL}/${createSlug(name)}`}</Text>
        </Stack>

      </Flex>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Type</Text>
        <Input
          variant={type === "" ? "outline" : "subtle"}
          value={type}
          onChange={(e) => setType(e.target.value)}
          size="sm"
          placeholder="e.g report, crm audit"
        />
      </Flex>
      <Flex
        py={2}
        alignItems="start"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Tags</Text>
        <Input
          variant={tags === "" ? "outline" : "subtle"}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. shopify,salesforce,crm (separate by comma)"
          size="sm"
        />
      </Flex>
      <Heading mt={4} fontSize="16px">Sharing and access</Heading>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Password</Text>
        <InputGroup
          endElement={
            <IconButton
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              variant="ghost"
              size="xs"
              onClick={() => setShowPasswords((current) => !current)}
              pointerEvents="auto"
            >
              {showPasswords ? <LuEyeOff /> : <LuEye />}
            </IconButton>
          }
        >
          <Input
            variant={password === "" ? "outline" : "subtle"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="sm"
            type={showPasswords ? "text" : "password"}
          />
        </InputGroup>
      </Flex>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Repeat Password</Text>
        <InputGroup
          endElement={
            <IconButton
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              variant="ghost"
              size="xs"
              onClick={() => setShowPasswords((current) => !current)}
              pointerEvents="auto"
            >
              {showPasswords ? <LuEyeOff /> : <LuEye />}
            </IconButton>
          }
        >
          <Input
            variant={repeatPassword === "" ? "outline" : "subtle"}
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            size="sm"
            type={showPasswords ? "text" : "password"}
          />
        </InputGroup>
      </Flex>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Expires At</Text>
        <DatePicker.Root isDateUnavailable={isPastDate} value={expiresAt} onValueChange={(e) => setExpiresAt(e.value)}>
          <DatePicker.Control>
            <DatePicker.Input />
            <DatePicker.IndicatorGroup>
              <DatePicker.Trigger>
                <LuCalendar />
              </DatePicker.Trigger>
            </DatePicker.IndicatorGroup>
          </DatePicker.Control>
          <Portal>
            <DatePicker.Positioner>
              <DatePicker.Content>
                <DatePicker.View view="day">
                  <DatePicker.Header />
                  <DatePicker.DayTable />
                </DatePicker.View>
                <DatePicker.View view="month">
                  <DatePicker.Header />
                  <DatePicker.MonthTable />
                </DatePicker.View>
                <DatePicker.View view="year">
                  <DatePicker.Header />
                  <DatePicker.YearTable />
                </DatePicker.View>
              </DatePicker.Content>
            </DatePicker.Positioner>
          </Portal>
        </DatePicker.Root>
      </Flex>
      <Heading mt={4} fontSize="16px">File</Heading>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Format</Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={format}
            onChange={(e) => setFormat(e.currentTarget.value)}>
            <option defaultChecked value=".html,.htm,text/html">HTML</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>
      <FileUpload.Root
        accept={[".html", ".htm"]}
        onFileAccept={(e) => {
          setFile(e.files[0])
          e.files[0].text().then(text => {
            console.log(text)
            setHtmlContent(text)
          })
        }}
      >
        <FileUpload.HiddenInput />
        <InputGroup
          startElement={<LuFileUp />}
          endElement={
            <FileUpload.ClearTrigger asChild>
              <CloseButton
                me="-1"
                size="xs"
                variant="plain"
                focusVisibleRing="inside"
                focusRingWidth="2px"
                pointerEvents="auto"
              />
            </FileUpload.ClearTrigger>
          }
        >
          <Input asChild>
            <FileUpload.Trigger>
              <FileUpload.FileText lineClamp={1} />
            </FileUpload.Trigger>
          </Input>
        </InputGroup>
      </FileUpload.Root>
      <HStack
        justify="flex-end"
        mt="auto"
        gap={2}
      >
        <Button size="sm" variant="outline">
          Cancel
        </Button>
        <Button
          loading={isLoading}
          size="sm"
          onClick={handleCreateAudit}
        >
          Create Audit
        </Button>
      </HStack>

    </Stack>
  )
}
