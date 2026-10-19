import { createFileRoute } from "@tanstack/react-router";

import { AddMenuScreen } from "@/components/bocadoo/owner-menu";
import { AppShell } from "@/components/bocadoo/ui";

export const Route = createFileRoute("/app/dueno/agregar-menu")({
  head: () => ({ meta: [{ title: "Bocadoo — Agregar menú" }] }),
  component: () => (
    <AppShell>
      <AddMenuScreen />
    </AppShell>
  ),
});
