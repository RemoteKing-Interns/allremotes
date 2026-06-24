"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SharedSpreadsheetRedirect({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  useEffect(() => {
    router.replace(`/s/${token}`);
  }, [token, router]);

  return null;
}