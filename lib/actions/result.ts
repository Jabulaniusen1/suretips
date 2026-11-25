import { unstable_rethrow } from "next/navigation";

// Production Next.js replaces the message of any error thrown from a Server
// Action with a generic "An error occurred in the Server Components render"
// text, so admins never saw *why* a save failed ("This fixture already has a
// prediction in that market", "Add alt text…"). Actions therefore return
// their outcome, and lib/actions/client.ts turns a failure back into a thrown
// Error in the browser, where the forms' existing try/catch + toast handle it.

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function toActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error); // let redirect()/notFound() work as usual
    console.error("[action]", error);
    return { ok: false, error: error instanceof Error && error.message ? error.message : "Something went wrong. Please try again." };
  }
}

export function unwrapActionResult<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
