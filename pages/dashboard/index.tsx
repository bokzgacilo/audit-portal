import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/dashboard/audits",
      permanent: false,
    },
  };
};

export default function DashboardRedirect() {
  return null;
}
