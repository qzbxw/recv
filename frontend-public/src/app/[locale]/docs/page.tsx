import { redirect } from "next/navigation";

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== "ru" && locale !== "en") {
    redirect("/en/docs/introduction");
  }
  redirect(`/${locale}/docs/introduction`);
}
