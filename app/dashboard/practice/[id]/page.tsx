"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PracticeLegacyDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    router.replace(`/dashboard/practice?session=${id}`);
  }, [params.id, router]);

  return (
    <div className="py-12 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
      <p className="text-muted-foreground">Redirecting to Practice Studio...</p>
    </div>
  );
}
