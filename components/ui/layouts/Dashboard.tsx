import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuChevronRight, LuFile, LuLogOut } from "react-icons/lu";
import { supabase } from "@/service/supabase";
import { ColorModeButton } from "../color-mode";

const NavTab = ({
  icon,
  label,
  path,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const isActive = currentPath === path || currentPath.startsWith(`${path}/`);

  return (
    <HStack
      alignItems="center"
      gap={4}
      rounded="sm"
      p={2}
      bg={isActive ? "bg.muted" : "transparent"}
      _hover={{
        bg: "bg.subtle",
      }}
      cursor="pointer"
      onClick={() => router.push(path)}
    >
      <Icon>{icon}</Icon>
      <Text fontSize="12px">{label}</Text>
      <Icon ml="auto">
        <LuChevronRight />
      </Icon>
    </HStack>
  );
};

const NavigationItems = [
  { icon: <LuFile />, label: "Audits", path: "/dashboard/audits" },
  // { icon: <LuUsers />, label: "Prospects", path: "/dashboard/prospects" },
  // { icon: <LuSettings />, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        router.replace("/");
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    router.replace("/");
  };

  if (isCheckingSession) {
    return (
      <Stack height="100vh" alignItems="center" justifyContent="center" gap={2}>
        <Text fontWeight="semibold">Kasama Audits</Text>
        <Text color="fg.subtle" fontSize="sm">
          Checking session...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack height="100vh" overflow="hidden" gap={0}>
      <Flex
        borderBottom="1px solid"
        borderBottomColor="border"
        p={2}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontWeight="semibold">Kasama Audits</Text>
        <HStack gap={2}>
          <ColorModeButton size="xs" />
          <Button
            size="xs"
            variant="outline"
            onClick={handleSignOut}
            loading={isSigningOut}
            disabled={isSigningOut}
          >
            <LuLogOut />
            Sign out
          </Button>
        </HStack>
      </Flex>
      <SimpleGrid flex={1} templateColumns="250px 1fr">
        <Stack p={2} borderRight="1px solid" gap={0} borderRightColor="border">
          <Text mb={2} mt={4} fontWeight="semibold" fontSize="xs">
            MANAGE
          </Text>
          {NavigationItems.map((item) => (
            <NavTab
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
            />
          ))}
        </Stack>
        <Box bg="bg.panel" overflowY="auto" p={0}>
          {children}
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
