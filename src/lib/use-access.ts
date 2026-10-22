/**
 * Which product the signed-in visitor gets.
 *
 * Both sites need the same three-way answer — is the session still resolving, is
 * this person signed in at all, and does the email hold a Teacher Portal account,
 * the Division Office account, or nothing yet — so it is decided in one place
 * instead of being re-derived (and re-got-wrong) on each page.
 *
 * The rules the auth skill sets out are kept here: nothing is shown for a
 * *pending* session (no sign-in form flashing at someone who is already signed
 * in), and a signed-out visitor is only reported once the session has resolved.
 * `syncWorkspace()` is driven from this hook, so the two sites cannot end up
 * reading the workspace for different identities.
 */
import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { AppUser } from "@/lib/auth/use-current-user";
import { resetWorkspace, syncWorkspace, useTeacherStore } from "./sbfp-store";
import type { SbfpAccount, TeacherStoreState } from "./sbfp-store";

export type AccessStatus =
  /** The session, or the first workspace read, is still resolving. */
  | "loading"
  /** Nobody is signed in — show the site's own sign-in form. */
  | "signed-out"
  /** Signed in, but this email holds no account yet. */
  | "no-account"
  /** The account exists and is on hold. */
  | "disabled"
  | "admin"
  | "teacher";

export interface Access {
  status: AccessStatus;
  user: AppUser | null;
  email: string | null;
  account: SbfpAccount | null;
  store: TeacherStoreState;
  /** Read the workspace again (after the Division Office changes something). */
  reload: () => void;
  /** Forget the workspace and sign out of this app's session. */
  forget: () => void;
}

export function useAccess(): Access {
  const { user, isPending } = useCurrentUserState();
  const store = useTeacherStore();
  const email = user?.primaryEmail?.toLowerCase() ?? null;

  useEffect(() => {
    if (isPending) return;
    if (!email) {
      resetWorkspace();
      return;
    }
    void syncWorkspace(email);
  }, [isPending, email]);

  // The workspace counts as loaded for this identity once a read has been
  // *attempted* for it, so a failed read lands on a real state (with
  // `store.syncError` explaining it) instead of spinning forever.
  const loaded = store.hydrated && store.email === email;
  const account = store.account;

  const status: AccessStatus = isPending
    ? "loading"
    : !email
      ? "signed-out"
      : !loaded
        ? "loading"
        : !account
          ? "no-account"
          : account.status !== "active"
            ? "disabled"
            : account.role === "admin"
              ? "admin"
              : "teacher";

  return {
    status,
    user,
    email,
    account,
    store,
    reload: () => void syncWorkspace(email, true),
    forget: resetWorkspace,
  };
}
