import {
  Badge,
  Box,
  Button,
  Checkbox,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Input,
  Portal,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuCopy, LuEye, LuFilter, LuPlus, LuSearch, LuTrash2, LuX } from "react-icons/lu";
import CreateAuditForm from "@/components/CreateAuditForm";
import { supabase } from "@/service/supabase";

type Audit = {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string;
  format: string;
  created_at: string;
  link?: string;
  file_path: string;
  html_text: string;
};

const PAGE_SIZE = 6;

const formatCreatedOn = (createdAt: string) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getAuditFormatLabel = (audit: Audit) => {
  const formatText = `${audit.format ?? ""} ${audit.file_path ?? ""}`.toLowerCase();

  if (formatText.includes("pdf")) {
    return "PDF";
  }

  if (formatText.includes("video") || formatText.includes("mp4") || formatText.includes("mov")) {
    return "Video";
  }

  if (formatText.includes("html") || formatText.includes("htm")) {
    return "HTML";
  }

  return audit.format || "—";
};

const getStatusLabel = (status: string) =>
  status?.toLowerCase() === "active" ? "Live" : "Draft";

export default function Audits() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [page, setPage] = useState(1);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAuditId, setDeletingAuditId] = useState<string | null>(null);
  const [copiedAuditId, setCopiedAuditId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAudits = async () => {
      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await supabase.from("audits").select("*");

      if (!isMounted) {
        return;
      }

      if (error) {
        setLoadError(error.message);
        setAudits([]);
        setIsLoading(false);
        return;
      }

      setAudits(
        (data ?? []).sort(
          (first, second) =>
            new Date(second.created_at).getTime() -
            new Date(first.created_at).getTime(),
        ),
      );
      setIsLoading(false);
    };

    loadAudits();

    return () => {
      isMounted = false;
    };
  }, []);

  const auditTypes = useMemo(
    () => [
      "All types",
      ...Array.from(new Set(audits.map((audit) => audit.type))),
    ],
    [audits],
  );

  const filteredAudits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return audits.filter((audit) => {
      const matchesType =
        typeFilter === "All types" || audit.type === typeFilter;
      const searchableText = [
        audit.name,
        audit.type,
        audit.status,
        audit.created_at,
        getAuditFormatLabel(audit),
      ]
        .join(" ")
        .toLowerCase();

      return matchesType && searchableText.includes(normalizedQuery);
    });
  }, [audits, query, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredAudits.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleAudits = filteredAudits.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleDeleteAudit = async (audit: Audit) => {
    const confirmed = window.confirm(`Delete "${audit.name}"?`);

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeletingAuditId(audit.id);

    const storagePaths = audit.file_path ? [audit.file_path] : [];

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("audits")
        .remove(storagePaths);

      if (storageError) {
        setDeleteError(storageError.message);
        setDeletingAuditId(null);
        return;
      }
    }

    const { error: tableError } = await supabase
      .from("audits")
      .delete()
      .eq("id", audit.id);

    if (tableError) {
      setDeleteError(tableError.message);
      setDeletingAuditId(null);
      return;
    }

    setAudits((currentAudits) =>
      currentAudits.filter((currentAudit) => currentAudit.id !== audit.id),
    );
    setDeletingAuditId(null);
    setSelection([]);
  };

  const handleCopyLink = async (audit: Audit) => {
    const auditUrl = `${window.location.origin}/${audit.slug}`;

    await navigator.clipboard.writeText(auditUrl);
    setCopiedAuditId(audit.id);
    window.setTimeout(() => setCopiedAuditId(null), 1500);
  };

  const [selection, setSelection] = useState<string[]>([])
  const indeterminate = selection.length > 0 && selection.length < visibleAudits.length

  return (
    <>
      <Head>
        <title>Audits - Kasama Audit Portal</title>
      </Head>
      <Stack h="full" gap={0} overflowY="auto" p={0}>
        <Flex p={2} gap={2} borderBottom="1px solid" borderBottomColor="border">
          <Drawer.Root size="lg">
            <Drawer.Trigger asChild>
              <IconButton variant="ghost">
                <LuPlus />
              </IconButton>
            </Drawer.Trigger>
            <Portal>
              <Drawer.Positioner>
                <Drawer.Content>
                  <Drawer.Header>
                    <Drawer.CloseTrigger asChild>
                      <IconButton variant="ghost">
                        <LuX />
                      </IconButton>
                    </Drawer.CloseTrigger>
                    <Drawer.Title>Create Audit</Drawer.Title>
                  </Drawer.Header>
                  <Drawer.Body>
                    <CreateAuditForm />
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>

          <IconButton variant="ghost">
            <LuFilter />
          </IconButton>

          <Input
            ml="auto"
            maxW="500px"
            variant="flushed"
            placeholder="Search audits, links, or shared emails"
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
          />
          <IconButton variant="ghost">
            <LuSearch />
          </IconButton>
        </Flex>
        <Table.ScrollArea>
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row bg="bg.muted">
                <Table.ColumnHeader w="6">
                  <Checkbox.Root
                    size="sm"
                    mt="0.5"
                    aria-label="Select all rows"
                    checked={indeterminate ? "indeterminate" : selection.length > 0}
                    onCheckedChange={(changes) => {
                      setSelection(
                        changes.checked ? visibleAudits.map((audit) => audit.name) : [],
                      )
                    }}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Format</Table.ColumnHeader>
                <Table.ColumnHeader>Created On</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={12}>
                    <Stack alignItems="center" gap={4} py={8}>
                      <Spinner size="md" />
                      <Text color="fg.subtle" fontSize="sm">
                        Loading audits...
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : null}
              {!isLoading && !loadError && visibleAudits.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={12}>
                    <Stack alignItems="center" gap={4} py={8}>
                      <Text fontWeight="medium">No audits found</Text>
                      <Text color="fg.subtle" fontSize="sm">
                        Try adjusting your search or filters
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : null}
              {!isLoading && !loadError
                ? visibleAudits.map((audit) => (
                  <Table.Row
                    key={audit.id}
                    data-selected={selection.includes(audit.name) ? "" : undefined}
                  >
                    <Table.Cell>
                      <Checkbox.Root
                        size="sm"
                        mt="0.5"
                        aria-label="Select row"
                        checked={selection.includes(audit.name)}
                        onCheckedChange={(changes) => {
                          setSelection((prev) =>
                            changes.checked
                              ? [...prev, audit.name]
                              : selection.filter((name) => name !== audit.name),
                          )
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                    <Table.Cell>{audit.name}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={
                          audit.status?.toLowerCase() === "active"
                            ? "green"
                            : "gray"
                        }
                        variant="subtle"
                      >
                        {getStatusLabel(audit.status)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{audit.type}</Table.Cell>
                    <Table.Cell>{getAuditFormatLabel(audit)}</Table.Cell>
                    <Table.Cell>{formatCreatedOn(audit.created_at)}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack justifyContent="flex-end">
                        <IconButton
                          asChild
                          aria-label={`View ${audit.name}`}
                          size="xs"
                          variant="ghost"
                        >
                          <Link href={`/${audit.slug}`}>
                            <LuEye />
                          </Link>
                        </IconButton>
                        <IconButton
                          aria-label={`Copy link for ${audit.name}`}
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopyLink(audit)}
                        >
                          <LuCopy />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${audit.name}`}
                          colorPalette="red"
                          size="xs"
                          variant="ghost"
                          loading={deletingAuditId === audit.id}
                          onClick={() => handleDeleteAudit(audit)}
                        >
                          <LuTrash2 />
                        </IconButton>
                        {copiedAuditId === audit.id ? (
                          <Text color="fg.subtle" fontSize="xs">
                            Copied
                          </Text>
                        ) : null}
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))
                : null}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        {deleteError ? (
          <Text color="red.fg" fontSize="sm">
            {deleteError}
          </Text>
        ) : null}
      </Stack>
    </>
  );
}

