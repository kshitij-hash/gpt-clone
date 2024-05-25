import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { signup } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OAuthButtons } from "../signin/oauth-signin";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/logo";

export default async function Signup({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const supabase = await createClient();

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if(user) {
    return redirect("/chat");
  }
  return (
    <section className="h-[calc(100vh-57px)] flex flex-col justify-center items-center gap-10">
      <Logo />
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription>
            Enter your email and password to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form id="login-form" className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                minLength={6}
                name="password"
                id="password"
                type="password"
                required
                placeholder="********"
              />
            </div>
            {searchParams.message && (
              <div className="text-sm font-medium text-destructive">
                {searchParams.message}
              </div>
            )}
            <Button formAction={signup} className="w-full">Sign up</Button>
          </form>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/signin" className="underline">
              Sign in
            </Link>
          </div>
          <Separator/>
          <OAuthButtons/>
        </CardContent>
      </Card>
    </section>
  );
}
