import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
  Wrap,
} from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuExternalLink,
  LuFileText,
  LuPlus,
  LuSearch,
  LuTrash2,
} from "react-icons/lu";
import { supabase } from "@/service/supabase";

type Audit = {
  id: string;
  name: string;
  type: string;
  createdOn: string;
  reportUrl: string;
  visitUrl: string;
  password?: string;
  slug: string;
  link: string;
  file_path: string;
};

const PAGE_SIZE = 6;

export default function Audits() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [page, setPage] = useState(1);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAuditId, setDeletingAuditId] = useState<string | null>(null);

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
            new Date(second.createdOn).getTime() -
            new Date(first.createdOn).getTime(),
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
        audit.createdOn,
        audit.reportUrl,
        audit.visitUrl,
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
  };

  return (
    <>
      <Head>
        <title>Audits - Kasama Audit Portal</title>
      </Head>
      <Stack h="full" gap={4} overflowY="auto" p={4}>
        <Flex alignItems="center" gap={4} justifyContent="space-between">
          <Box>
            <Heading size="3xl">Audits</Heading>
            <Text color="fg.subtle" fontSize="sm">
              {filteredAudits.length} records
            </Text>
          </Box>
          <Button asChild size="sm">
            <Link href="/dashboard/audits/create">
              <LuPlus />
              New audit
            </Link>
          </Button>
        </Flex>

        <Flex
          alignItems={{ base: "stretch", md: "center" }}
          gap={3}
          flexDirection={{ base: "column", md: "row" }}
        >
          <Box flex={1} position="relative">
            <Icon
              color="fg.subtle"
              left={3}
              pointerEvents="none"
              position="absolute"
              top="50%"
              transform="translateY(-50%)"
            >
              <LuSearch />
            </Icon>
            <Input
              pl={10}
              placeholder="Search audits, links, or shared emails"
              value={query}
              onChange={(event) => handleSearch(event.target.value)}
            />
          </Box>
          <NativeSelect.Root maxW={{ base: "full", md: "220px" }}>
            <NativeSelect.Field
              value={typeFilter}
              onChange={(event) => handleFilter(event.target.value)}
            >
              {auditTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Flex>

        <Box
          border="1px solid"
          borderColor="border"
          overflow="hidden"
          rounded="sm"
        >
          <Table.ScrollArea>
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row bg="bg.muted">
                  <Table.ColumnHeader minW="260px">Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Type</Table.ColumnHeader>
                  <Table.ColumnHeader minW="130px">
                    Created on
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Links</Table.ColumnHeader>
                  <Table.ColumnHeader>Visit</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {isLoading ? (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Stack alignItems="center" gap={3} py={10}>
                        <Spinner size="md" />
                        <Text color="fg.subtle" fontSize="sm">
                          Loading audits...
                        </Text>
                      </Stack>
                    </Table.Cell>
                  </Table.Row>
                ) : null}
                {!isLoading && loadError ? (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Stack alignItems="center" gap={1} py={8}>
                        <Text fontWeight="medium">Could not load audits</Text>
                        <Text color="fg.subtle" fontSize="sm">
                          {loadError}
                        </Text>
                      </Stack>
                    </Table.Cell>
                  </Table.Row>
                ) : null}
                {!isLoading && !loadError
                  ? visibleAudits.map((audit) => (
                      <Table.Row key={audit.id}>
                        <Table.Cell>
                          <Stack gap={0}>
                            <Button
                              asChild
                              alignSelf="flex-start"
                              h="auto"
                              minW={0}
                              p={0}
                              textAlign="left"
                              variant="plain"
                              whiteSpace="normal"
                            >
                              <Link href={`/${audit.slug}`}>{audit.name}</Link>
                            </Button>
                            <Text color="fg.subtle" fontSize="xs">
                              {audit.id}
                            </Text>
                          </Stack>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette="blue" variant="subtle">
                            {audit.type}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell whiteSpace="nowrap">
                          {audit.createdOn}
                        </Table.Cell>
                        <Table.Cell>
                          <Button size="xs" variant="ghost">
                            <LuFileText />
                            Report
                          </Button>
                        </Table.Cell>
                        <Table.Cell>
                          <IconButton
                            asChild
                            aria-label={`Visit ${audit.name}`}
                            size="xs"
                            variant="outline"
                          >
                            <a
                              href={audit.visitUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <LuExternalLink />
                            </a>
                          </IconButton>
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          <IconButton
                            aria-label={`Delete ${audit.name}`}
                            colorPalette="red"
                            disabled={deletingAuditId !== null}
                            loading={deletingAuditId === audit.id}
                            onClick={() => handleDeleteAudit(audit)}
                            size="xs"
                            variant="outline"
                          >
                            <LuTrash2 />
                          </IconButton>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  : null}
                {!isLoading && !loadError && visibleAudits.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Stack alignItems="center" gap={1} py={8}>
                        <Text fontWeight="medium">No audits found</Text>
                        <Text color="fg.subtle" fontSize="sm">
                          Adjust the search or filter to show more records.
                        </Text>
                      </Stack>
                    </Table.Cell>
                  </Table.Row>
                ) : null}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Box>

        {deleteError ? (
          <Text color="red.fg" fontSize="sm">
            {deleteError}
          </Text>
        ) : null}

        <Flex alignItems="center" gap={3} justifyContent="space-between">
          <Text color="fg.subtle" fontSize="sm">
            Showing {filteredAudits.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + PAGE_SIZE, filteredAudits.length)} of{" "}
            {filteredAudits.length}
          </Text>
          <HStack gap={2}>
            <IconButton
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              size="xs"
              variant="outline"
            >
              <LuChevronLeft />
            </IconButton>
            <Text fontSize="sm" minW="72px" textAlign="center">
              Page {currentPage} of {pageCount}
            </Text>
            <IconButton
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              size="xs"
              variant="outline"
            >
              <LuChevronRight />
            </IconButton>
          </HStack>
        </Flex>
      </Stack>
    </>
  );
}
