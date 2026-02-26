import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import LandingClient from "./LandingClient";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <LandingClient isLoggedIn={!!session} />;
}
