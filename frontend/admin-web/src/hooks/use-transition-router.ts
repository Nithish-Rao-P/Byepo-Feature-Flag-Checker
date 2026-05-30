"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "@/src/components/transition-provider";

export function useTransitionRouter() {
  const router = useRouter();
  const transition = useTransition();

  return {
    ...router,
    push: (href: string, preSwap?: () => void) => {
      transition.startTransition(() => {
        if (preSwap) preSwap();
        router.push(href);
      });
    },
    replace: (href: string, preSwap?: () => void) => {
      transition.startTransition(() => {
        if (preSwap) preSwap();
        router.replace(href);
      });
    },
    back: (preSwap?: () => void) => {
      transition.startTransition(() => {
        if (preSwap) preSwap();
        router.back();
      });
    },
  };
}
