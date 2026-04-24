import {
  Badge,
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Portal,
  Separator,
  Spinner,
  Stack,
  Table,
  Tag,
  Text,
} from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuCopy, LuEye, LuEyeOff, LuPlus, LuSearch, LuTrash2, LuX } from "react-icons/lu";
import CreateAuditForm from "@/components/CreateAuditForm";
import { supabase } from "@/service/supabase";
import { toaster } from "@/components/ui/toaster";

type Audit = {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string;
  format: string;
  created_at: string;
  expires_at?: string;
  tags?: string[];
  password?: string;
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
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedDeleteAudit, setSelectedDeleteAudit] = useState<Audit | null>(null);
  const [showAuditPassword, setShowAuditPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editedPassword, setEditedPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
        audit.tags?.join(" "),
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


  const handleDeleteAudit = async (audit: Audit) => {
    setDeleteError(null);
    setDeletingAuditId(audit.id);

    const storagePaths = audit.file_path ? [audit.file_path] : [];

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("audits")
        .remove(storagePaths);

      if (storageError) {
        setDeletingAuditId(null);
        toaster.create({
          title: "Error deleting audit",
          description: storageError.message,
          type: "error",
          closable: true,
        })
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

    toaster.create({
      title: "Audit deleted",
      description: "The audit has been deleted.",
      type: "success",
      closable: true,
    })

    setDeletingAuditId(null);
    setSelection([]);
  };

  const handleCopyLink = async (audit: Audit) => {
    const auditUrl = `${window.location.origin}/${audit.slug}`;

    await navigator.clipboard.writeText(auditUrl);

    toaster.create({
      title: "Copied to clipboard",
      description: auditUrl,
      type: "info",
      closable: true,
    })
  };

  const handleOpenDetails = (audit: Audit) => {
    setSelectedAudit(audit);
    setIsDetailsOpen(true);
    setShowAuditPassword(false);
    setIsEditingPassword(false);
    setEditedPassword(audit.password ?? "");
    setRepeatPassword("");
  };

  const handleUpdatePassword = async () => {
    if (!selectedAudit) {
      return;
    }

    if (editedPassword !== repeatPassword) {
      toaster.create({
        title: "Passwords do not match",
        description: "Enter the same password in both fields.",
        type: "error",
        closable: true,
      });
      return;
    }

    setIsUpdatingPassword(true);

    const { error } = await supabase
      .from("audits")
      .update({ password: editedPassword })
      .eq("id", selectedAudit.id);

    setIsUpdatingPassword(false);

    if (error) {
      toaster.create({
        title: "Could not update password",
        description: error.message,
        type: "error",
        closable: true,
      });
      return;
    }

    const updatedAudit = {
      ...selectedAudit,
      password: editedPassword,
    };

    setSelectedAudit(updatedAudit);
    setAudits((currentAudits) =>
      currentAudits.map((audit) =>
        audit.id === selectedAudit.id ? updatedAudit : audit,
      ),
    );
    setIsEditingPassword(false);
    setRepeatPassword("");

    toaster.create({
      title: "Password updated",
      description: editedPassword
        ? "The audit password has been updated."
        : "Password protection has been removed.",
      type: "success",
      closable: true,
    });
  };

  const [selection, setSelection] = useState<string[]>([])
  const indeterminate = selection.length > 0 && selection.length < visibleAudits.length

  return (
    <>
      <Head>
        <title>Audits - Kasama Audit Portal</title>
      </Head>
      <Dialog.Root
        open={isDeleteModalOpen}
        lazyMount
        onOpenChange={(e) => setIsDeleteModalOpen(e.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete Audit</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text fontWeight="semibold">Are you sure you want to delete this audit?</Text>
                <Stack mt={4}>
                  <Flex>
                    <Text fontWeight="semibold" w="100px">Name</Text>
                    <Text>{selectedDeleteAudit?.name}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="semibold" w="100px">Type</Text>
                    <Text>{selectedDeleteAudit?.type}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="semibold" w="100px">Status</Text>
                    <Text>{getStatusLabel(selectedDeleteAudit?.status ?? '')}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="semibold" w="100px">Tags</Text>
                    <Text>{selectedDeleteAudit?.tags?.join(", ")}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="semibold" w="100px">Created at</Text>
                    <Text>{formatCreatedOn(selectedDeleteAudit?.created_at ?? '')}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="semibold" w="100px">Expires at</Text>
                    <Text>{formatCreatedOn(selectedDeleteAudit?.expires_at ?? '')}</Text>
                  </Flex>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button size="xs" variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button loading={deletingAuditId === selectedDeleteAudit?.id} size="xs" colorPalette="red" onClick={async () => {
                  await handleDeleteAudit(selectedDeleteAudit as Audit);
                  setIsDeleteModalOpen(false);
                }}>
                  Yes, delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <Stack h="full" gap={0} overflowY="auto" p={0}>
        <Flex p={2} gap={2} borderBottom="1px solid" borderBottomColor="border">
          <Drawer.Root size="lg">
            <Drawer.Trigger asChild>
              <IconButton variant="ghost">
                <LuPlus />
              </IconButton>
            </Drawer.Trigger>
            <Portal>
              <Drawer.Backdrop />
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

          {/* <IconButton variant="ghost">
            <LuFilter />
          </IconButton> */}

          <Input
            ml="auto"
            maxW="500px"
            variant="flushed"
            placeholder="Search audit name, type, or tags"
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
          />
          <IconButton variant="ghost">
            <LuSearch />
          </IconButton>
        </Flex>
        <Table.ScrollArea>
          <Table.Root showColumnBorder variant="line">
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
                <Table.ColumnHeader>Tags</Table.ColumnHeader>
                {/* <Table.ColumnHeader>Format</Table.ColumnHeader> */}
                <Table.ColumnHeader w={6}>Created On</Table.ColumnHeader>
                <Table.ColumnHeader w={6}>Expires On</Table.ColumnHeader>
                <Table.ColumnHeader w={6}>Status</Table.ColumnHeader>
                <Table.ColumnHeader w={6}>
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
                    <Stack alignItems="center" gap={0} py={4}>
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
                    cursor="pointer"
                    onClick={() => handleOpenDetails(audit)}
                  >
                    <Table.Cell
                      py={2}
                      onClick={(event) => event.stopPropagation()}
                    >
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
                    <Table.Cell py={2}>{audit.name}</Table.Cell>

                    <Table.Cell py={2}>
                      <HStack gap={1}>
                        {audit.tags?.map((tag) => (
                          <Tag.Root colorPalette="blue" size="sm" key={tag}>
                            <Tag.Label>{tag}</Tag.Label>
                          </Tag.Root>
                        ))}
                      </HStack>
                    </Table.Cell>
                    {/* <Table.Cell py={2}>{getAuditFormatLabel(audit)}</Table.Cell> */}
                    <Table.Cell py={2}>{formatCreatedOn(audit.created_at)}</Table.Cell>
                    <Table.Cell py={2}>{formatCreatedOn(audit.expires_at ?? '')}</Table.Cell>
                    <Table.Cell py={2}>
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
                    <Table.Cell py={2} onClick={(event) => event.stopPropagation()}>
                      <HStack justifyContent="flex-end">
                        <IconButton
                          asChild
                          aria-label={`View ${audit.name}`}
                          size="xs"
                          disabled={deletingAuditId === audit.id}
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
                          disabled={deletingAuditId === audit.id}
                          onClick={() => handleCopyLink(audit)}
                        >
                          <LuCopy />
                        </IconButton>
                        {/* <IconButton
                          aria-label={`Disable ${audit.name}`}
                          size="xs"
                          variant="ghost"
                          disabled={deletingAuditId === audit.id}
                          onClick={() => handleDeleteAudit(audit)}
                        >
                          <LuKey />
                        </IconButton> */}
                        <IconButton
                          aria-label={`Delete ${audit.name}`}
                          colorPalette="red"
                          size="xs"
                          variant="ghost"
                          loading={deletingAuditId === audit.id}
                          onClick={() => {
                            setSelectedDeleteAudit(audit)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <LuTrash2 />
                        </IconButton>
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
      <Drawer.Root
        open={isDetailsOpen}
        onOpenChange={(details) => {
          setIsDetailsOpen(details.open);

          if (!details.open) {
            setSelectedAudit(null);
            setShowAuditPassword(false);
            setIsEditingPassword(false);
            setEditedPassword("");
            setRepeatPassword("");
          }
        }}
        size="md"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.CloseTrigger asChild>
                  <IconButton variant="ghost">
                    <LuX />
                  </IconButton>
                </Drawer.CloseTrigger>
                <Drawer.Title>
                  {selectedAudit ? selectedAudit.name : "Audit details"}
                </Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                {selectedAudit ? (
                  <Stack gap={5}>
                    <AuditDetail
                      label="Status"
                      value={
                        <Badge
                          colorPalette={
                            selectedAudit.status?.toLowerCase() === "active"
                              ? "green"
                              : "gray"
                          }
                          variant="subtle"
                        >
                          {getStatusLabel(selectedAudit.status)}
                        </Badge>
                      }
                    />
                    <AuditDetail label="Type" value={selectedAudit.type || "—"} />
                    <AuditDetail
                      label="Format"
                      value={getAuditFormatLabel(selectedAudit)}
                    />
                    <AuditDetail
                      label="Created On"
                      value={formatCreatedOn(selectedAudit.created_at)}
                    />
                    <AuditDetail
                      label="Expires At"
                      value={selectedAudit.expires_at || "—"}
                    />
                    <AuditDetail label="Slug" value={selectedAudit.slug} />
                    <AuditDetail
                      label="Tags"
                      value={
                        selectedAudit.tags && selectedAudit.tags.length > 0
                          ? selectedAudit.tags.join(", ")
                          : "—"
                      }
                    />
                    <Stack gap={1}>
                      <Text color="fg.subtle" fontSize="xs" fontWeight="semibold">
                        Password
                      </Text>
                      <Box
                        border="1px solid"
                        borderColor="border"
                        borderRadius="md"
                        px={3}
                        py={3}
                      >
                        <Stack gap={3}>
                          <InputGroup
                            endElement={
                              <IconButton
                                aria-label={
                                  showAuditPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                                variant="ghost"
                                size="xs"
                                onClick={() =>
                                  setShowAuditPassword((current) => !current)
                                }
                                pointerEvents="auto"
                              >
                                {showAuditPassword ? <LuEyeOff /> : <LuEye />}
                              </IconButton>
                            }
                          >
                            <Input
                              value={isEditingPassword ? editedPassword : selectedAudit.password ?? ""}
                              onChange={(event) =>
                                setEditedPassword(event.target.value)
                              }
                              type={showAuditPassword ? "text" : "password"}
                              disabled={!isEditingPassword}
                              placeholder="No password"
                            />
                          </InputGroup>

                          {isEditingPassword ? (
                            <>
                              <Input
                                value={repeatPassword}
                                onChange={(event) =>
                                  setRepeatPassword(event.target.value)
                                }
                                type={showAuditPassword ? "text" : "password"}
                                placeholder="Repeat password"
                              />
                              <HStack>
                                <Button
                                  size="sm"
                                  onClick={handleUpdatePassword}
                                  loading={isUpdatingPassword}
                                >
                                  Update Password
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setIsEditingPassword(false);
                                    setEditedPassword(selectedAudit.password ?? "");
                                    setRepeatPassword("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </HStack>
                            </>
                          ) : (
                            <HStack>
                              <Button
                                size="sm"
                                variant="subtle"
                                onClick={() => {
                                  setIsEditingPassword(true);
                                  setEditedPassword(selectedAudit.password ?? "");
                                  setRepeatPassword("");
                                }}
                              >
                                Change Password
                              </Button>
                            </HStack>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                    {/* <AuditDetail
                      label="File Path"
                      value={selectedAudit.file_path || "—"}
                    /> */}
                    {/* <AuditDetail
                      label="Public Link"
                      value={selectedAudit.link || "—"}
                    /> */}


                    <Stack alignItems="stretch" mt="auto" gap={2}>
                      <Button asChild variant="outline">
                        <Link href={`/${selectedAudit.slug}`}>
                          <LuEye />
                          Open audit page
                        </Link>
                      </Button>
                      <Button
                        variant="subtle"
                        onClick={() => handleCopyLink(selectedAudit)}
                      >
                        <LuCopy />
                        Copy share link
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}

function AuditDetail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Stack gap={1}>
      <Text color="fg.subtle" fontSize="xs" fontWeight="semibold">
        {label}
      </Text>
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        px={3}
        py={2}
      >
        {typeof value === "string" ? (
          <Text fontSize="sm" wordBreak="break-word">
            {value}
          </Text>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}
