import { LoadingProvider } from "@/lib/loading-context";

export default function RoofRenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LoadingProvider>{children}</LoadingProvider>;
}
