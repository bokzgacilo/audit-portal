import { supabase } from "@/service/supabase";
import { Box, Button, CloseButton, DatePicker, DateValue, FileUpload, Flex, Heading, HStack, Input, InputGroup, NativeSelect, parseDate, Portal, Stack, Text, useDatePicker, useFileUpload } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuCalendar, LuFileUp, LuUpload } from "react-icons/lu";

const today = new Date();
const tomorrow = new Date(today);

const createSlug = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "audit"}`;
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
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState([parseDate("2026-01-26")])
  const [values, setValues] = useState({
    name: "",
    type: "",
    description: "",
    tags: "",
    password: "",
    repeatPassword: "",
    format: ".html,.htm,text/html",
  })
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: 25000,
    accept: values.format.split(','),
  })

  useEffect(() => {
    const getContent = async () => {
      const uploadedFile = fileUpload.acceptedFiles[0];

      if (values.format.includes("html") && uploadedFile) {
        const content = await uploadedFile.text();
        setHtmlContent(content)
      }
    }
    getContent()
  }, [fileUpload])

  const handleCreateAudit = async () => {
    if (!values.name.trim() || !values.type.trim()) {
      return;
    }

    if (!fileUpload.acceptedFiles) {
      return;
    }

    if (values.password !== values.repeatPassword) {
      alert("password mismatch")
      return;
    }

    setIsLoading(true)

    const normalizedTags = values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(", ");
    const slug = createSlug(values.name);

    const fileName = fileUpload.acceptedFiles[0].name;
    const filePath = `/${createSlug(values.name)}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("audits")
      .upload(filePath, fileUpload.acceptedFiles[0], {
        contentType: fileUpload.acceptedFiles[0].type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.log("upload error")
      return;
    }

    const { data: storage_data } = supabase.storage
      .from("audits")
      .getPublicUrl(filePath);



    const { data, error: insertError } = await supabase
      .from("audits")
      .insert({
        name: values.name.trim(),
        type: values.type.trim(),
        format: values.format,
        tags: normalizedTags,
        password: values.password,
        expires_at: expiresAt.map((d) => d.toString()).join(", "),
        slug,
        html_text: htmlContent,
        link: storage_data.publicUrl,
        file_path: filePath,
      })
      .select("id")
      .single();
    setIsLoading(false)

    if (insertError) {
      console.log("insert error")
      return;
    }

    console.log("audit created")
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
            variant={values.name === "" ? "outline" : "subtle"}
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            placeholder="e.g. 2023 Annual Audit"
            size="sm"
          />
          <Text fontSize="xs">https://kasama-audit.vercel.app/{values.name.toLowerCase().replaceAll(" ", "-")}</Text>
        </Stack>

      </Flex>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Type</Text>
        <Input
          variant={values.type === "" ? "outline" : "subtle"}
          value={values.type}
          onChange={(e) => setValues({ ...values, type: e.target.value })}
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
          variant={values.tags === "" ? "outline" : "subtle"}
          value={values.tags}
          onChange={(e) => setValues({ ...values, tags: e.target.value })}
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
        <Input
          variant={values.password === "" ? "outline" : "subtle"}
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          size="sm"
          type="password"
        />
      </Flex>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Repeat Password</Text>
        <Input
          variant={values.repeatPassword === "" ? "outline" : "subtle"}
          value={values.repeatPassword}
          onChange={(e) => setValues({ ...values, repeatPassword: e.target.value })}
          size="sm"
          type="password"
        />
      </Flex>
      <Flex
        py={2}
        alignItems="center"
        gap={0}
      >
        <Text fontWeight="semibold" fontSize="12px" w="175px">Expires At</Text>
        <DatePicker.Root
          isDateUnavailable={isPastDate}
          value={expiresAt}
          onValueChange={(e) => setExpiresAt(e.value)}
          size="sm"
        >
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
        <NativeSelect.Root variant="subtle" size="sm">
          <NativeSelect.Field
            value={values.format}
            onChange={(e) => setValues({ ...values, format: e.currentTarget.value })}>
            <option defaultChecked value=".html,.htm,text/html">HTML</option>
            <option value=".pdf,application/pdf">PDF</option>
            <option value=".mp4,.mov,.avi,.mkv,video/*">Video</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Flex>
      <FileUpload.RootProvider mt={2} value={fileUpload}>
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
      </FileUpload.RootProvider>
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