import { redirect } from "next/navigation";

/**
 * Redirect any /gpat traffic to the main page.
 * This route exists only to prevent 404s from old GPAT links.
 */
export default function GPATRedirect() {
  redirect("/");
}
