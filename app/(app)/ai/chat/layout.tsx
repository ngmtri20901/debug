import { DataStreamProvider } from '@/features/ai/chat/components/core/data-stream-provider';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataStreamProvider>
      {children}
    </DataStreamProvider>
  );
}
