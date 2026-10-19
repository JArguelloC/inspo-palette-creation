import { useNavigate } from "@tanstack/react-router";
import {
  AtSign,
  Banknote,
  Check,
  CircleCheck,
  Flashlight,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ScanLine,
  Search,
  Utensils,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import lunchImage from "@/assets/bocadoo-lunch.jpg";
import soupImage from "@/assets/bocadoo-soup.jpg";
import veggieImage from "@/assets/bocadoo-veggie.jpg";

import {
  APP_USERS,
  initialsOf,
  money,
  useBocadoo,
  type AppUser,
  type ChargeTarget,
  type Client,
  type Plan,
} from "./store";
import {
  Avatar,
  FieldLabel,
  PaymentMethods,
  PosItem,
  PrimaryButton,
  ScanCorner,
  ScreenHeader,
  StatusBadge,
  Stepper,
} from "./ui";

// Une usuarios registrados en la app con los "Contactos sin plan" del dueño en una sola lista buscable.
type Person = {
  key: string;
  name: string;
  sub: string;
  status: "Registrado" | "Sin plan" | "Plan activo";
  target: ChargeTarget;
  lunchesLeft: number;
};

function usePeopleDirectory(): Person[] {
  const { clients } = useBocadoo();
  return useMemo(() => {
    const clientByUser = new Map(clients.filter((c) => c.userId).map((c) => [c.userId!, c]));
    const fromUsers: Person[] = APP_USERS.map((u) => {
      const client = clientByUser.get(u.id);
      return {
        key: `u-${u.id}`,
        name: u.name,
        sub: `@${u.username}`,
        status: client?.planId ? "Plan activo" : "Registrado",
        target: client ? { kind: "client", client } : { kind: "user", user: u },
        lunchesLeft: client?.lunchesLeft ?? 0,
      };
    });
    const fromContacts: Person[] = clients
      .filter((c) => !c.userId)
      .map((c) => ({
        key: `c-${c.id}`,
        name: c.name,
        sub: c.email,
        status: c.planId ? "Plan activo" : "Sin plan",
        target: { kind: "client", client: c },
        lunchesLeft: c.lunchesLeft,
      }));
    return [...fromUsers, ...fromContacts];
  }, [clients]);
}

const SearchBar = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <label className="mt-4 flex h-12 items-center gap-3 rounded-xl bg-card px-4 shadow-soft ring-primary focus-within:ring-2">
    <Search size={16} className="shrink-0 text-muted-foreground" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:font-medium placeholder:text-muted-foreground"
    />
  </label>
);

const PersonRow = ({ person, onSelect }: { person: Person; onSelect: () => void }) => (
  <button
    type="button"
    onClick={onSelect}
    className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-2.5 text-left shadow-soft"
  >
    <Avatar initials={initialsOf(person.name)} />
    <div className="min-w-0">
      <p className="truncate text-xs font-extrabold">{person.name}</p>
      <p className="truncate text-[9px] text-muted-foreground">{person.sub}</p>
    </div>
    <StatusBadge status={person.status} />
  </button>
);

const PLAN_CARD_STYLE = "relative rounded-xl border p-2.5 text-left";

// Acciones del dueño 1: cobrar un plan a un cliente ya registrado o a un contacto sin plan.
export function ChargeScreen({ initialClientId }: { initialClientId?: string | undefined }) {
  const { plans, chargePlan, clients } = useBocadoo();
  const navigate = useNavigate();
  const directory = usePeopleDirectory();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Person | null>(() => {
    if (!initialClientId) return null;
    const client = clients.find((c) => c.id === initialClientId);
    return client
      ? (directory.find((p) => p.target.kind === "client" && p.target.client.id === client.id) ??
          null)
      : null;
  });
  const [planId, setPlanId] = useState(plans[2]?.id ?? plans[0]?.id ?? "");
  const [method, setMethod] = useState("Efectivo");

  const results = query.trim()
    ? directory.filter((p) =>
        `${p.name} ${p.sub}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : directory;
  const plan = plans.find((p) => p.id === planId);

  const confirm = () => {
    if (!selected || !plan) return;
    chargePlan(selected.target, plan);
    toast.success("Cobro confirmado", {
      description: `${selected.name} · ${plan.name} · ${money(plan.price)}`,
    });
    navigate({ to: "/app/dueno" });
  };

  if (!selected) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <ScreenHeader eyebrow="COBRAR PLAN" title="Buscar cliente" back="/app/dueno" />
          <SearchBar value={query} onChange={setQuery} placeholder="Busca por username o correo" />
          <div className="mt-4 space-y-2">
            {results.length === 0 && (
              <p className="mt-8 text-center text-xs text-muted-foreground">
                Sin resultados para "{query}".
              </p>
            )}
            {results.map((p) => (
              <PersonRow key={p.key} person={p} onSelect={() => setSelected(p)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <ScreenHeader eyebrow="COBRAR PLAN" title="Nuevo cobro" back="/app/dueno/cobrar" />
        <FieldLabel>CLIENTE</FieldLabel>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-muted p-2.5 text-left"
        >
          <Avatar initials={initialsOf(selected.name)} />
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold">{selected.name}</p>
            <p className="truncate text-[9px] text-muted-foreground">{selected.sub}</p>
          </div>
          <StatusBadge status={selected.status} />
        </button>
        <FieldLabel>PLAN A COBRAR</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {plans.map((p) => {
            const on = p.id === planId;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={`${PLAN_CARD_STYLE} ${on ? "border-primary bg-accent" : "border-border"}`}
              >
                {on && (
                  <div className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
                <p className="text-[8px] font-black text-primary">{p.type.toUpperCase()}</p>
                <p className="mt-1.5 text-[11px] font-extrabold">{p.lunches} almuerzos</p>
                <p className="mt-0.5 text-sm font-black">{money(p.price)}</p>
              </button>
            );
          })}
        </div>
        <FieldLabel>MÉTODO DE PAGO</FieldLabel>
        <PaymentMethods selected={method} onSelect={setMethod} />
        {plan && (
          <div className="mt-4 space-y-1.5 rounded-2xl bg-muted p-3.5 text-[10px]">
            <div className="flex justify-between text-muted-foreground">
              <span>
                {plan.name} · {plan.lunches} almuerzos
              </span>
              <span>{money(plan.price)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Precio por almuerzo</span>
              <span>{money(plan.price / plan.lunches)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-black">
              <span>Total</span>
              <span>{money(plan.price)}</span>
            </div>
          </div>
        )}
        <PrimaryButton onClick={confirm} disabled={!plan}>
          <Check size={16} /> Confirmar cobro{plan ? ` · ${money(plan.price)}` : ""}
        </PrimaryButton>
      </div>
    </div>
  );
}

// Acciones del dueño 2: descontar un almuerzo escaneando el QR del comensal o buscándolo por usuario.
export function ScanDiscountScreen() {
  const { clients, discountLunch } = useBocadoo();
  const directory = usePeopleDirectory().filter((p) => p.lunchesLeft > 0);
  const [tab, setTab] = useState<"scan" | "search">("scan");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Person | null>(null);
  const [done, setDone] = useState(false);

  const results = query.trim()
    ? directory.filter((p) =>
        `${p.name} ${p.sub}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : directory;

  const simulateScan = () => {
    const withLunches = clients.find((c) => c.lunchesLeft > 0);
    if (!withLunches) {
      toast.error("No hay comensales con almuerzos disponibles para simular.");
      return;
    }
    const person = directory.find(
      (p) => p.target.kind === "client" && p.target.client.id === withLunches.id,
    );
    if (person) {
      setFound(person);
      setDone(false);
    }
  };

  const confirmDiscount = () => {
    if (!found || found.target.kind !== "client") return;
    discountLunch(found.target.client.id);
    setDone(true);
    toast.success("Almuerzo descontado", {
      description: `${found.name} · ${found.lunchesLeft - 1} almuerzos restantes`,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <ScreenHeader
          eyebrow="ESCANEAR QR / DESCONTAR"
          title="Descontar almuerzo"
          back="/app/dueno"
        />
        <div className="mt-4 grid grid-cols-2 rounded-xl bg-muted p-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("scan");
              setFound(null);
              setDone(false);
            }}
            className={
              tab === "scan"
                ? "rounded-[9px] bg-primary py-2 text-center text-primary-foreground"
                : "py-2 text-center text-muted-foreground"
            }
          >
            Escanear QR
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("search");
              setFound(null);
              setDone(false);
            }}
            className={
              tab === "search"
                ? "rounded-[9px] bg-primary py-2 text-center text-primary-foreground"
                : "py-2 text-center text-muted-foreground"
            }
          >
            Buscar usuario
          </button>
        </div>

        {tab === "scan" ? (
          <div className="mt-4 rounded-[24px] bg-card-dark p-4 text-card-dark-foreground shadow-card">
            <div className="relative grid h-[190px] place-items-center overflow-hidden rounded-2xl bg-phone">
              <QrCode size={100} strokeWidth={1.2} className="text-card-dark-muted/40" />
              <ScanCorner className="left-5 top-5 rounded-tl-xl border-l-4 border-t-4" />
              <ScanCorner className="right-5 top-5 rounded-tr-xl border-r-4 border-t-4" />
              <ScanCorner className="bottom-5 left-5 rounded-bl-xl border-b-4 border-l-4" />
              <ScanCorner className="bottom-5 right-5 rounded-br-xl border-b-4 border-r-4" />
              <div className="absolute inset-x-8 top-[48%] h-0.5 rounded-full bg-primary shadow-brand" />
              <div className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-background/15">
                <Flashlight size={14} />
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] text-card-dark-muted">
              Apunta la cámara al código QR del comensal
            </p>
            <button
              type="button"
              onClick={simulateScan}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-background text-xs font-extrabold text-foreground"
            >
              <ScanLine size={15} /> Simular escaneo
            </button>
          </div>
        ) : (
          <>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Busca por nombre de usuario"
            />
            <div className="mt-3 space-y-2">
              {results.length === 0 && (
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  Sin comensales con almuerzos disponibles.
                </p>
              )}
              {results.map((p) => (
                <PersonRow
                  key={p.key}
                  person={p}
                  onSelect={() => {
                    setFound(p);
                    setDone(false);
                  }}
                />
              ))}
            </div>
          </>
        )}

        {found && (
          <div className="mt-4 rounded-2xl bg-card p-3 shadow-soft animate-in fade-in">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3">
              <Avatar initials={initialsOf(found.name)} />
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold">{found.name}</p>
                <p className="truncate text-[9px] text-muted-foreground">
                  {found.sub} · {found.lunchesLeft} almuerzos
                </p>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-black text-success">
                <CircleCheck size={13} /> Válido
              </span>
            </div>
            <PrimaryButton onClick={confirmDiscount} disabled={done}>
              {done ? (
                <>
                  <Check size={15} /> Descontado
                </>
              ) : (
                <>
                  <Utensils size={15} /> Descontar 1 almuerzo
                </>
              )}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

type CartLine = { name: string; price: number; qty: number; isLunch: boolean };
const POS_CATALOG: Array<{ name: string; price: number; image: string; isLunch: boolean }> = [
  { name: "Almuerzo del día", price: 3.0, image: lunchImage, isLunch: true },
  { name: "Almuerzo veggie", price: 3.25, image: veggieImage, isLunch: true },
  { name: "Solo sopa", price: 1.25, image: soupImage, isLunch: false },
  { name: "Solo segundo", price: 2.5, image: lunchImage, isLunch: false },
];

// Acciones del dueño 4: registro de consumo tipo POS para ventas directas.
export function PosScreen() {
  const { posSale } = useBocadoo();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [method, setMethod] = useState("Efectivo");

  const lines = Object.values(cart);
  const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const lunchCount = lines.reduce((sum, l) => sum + (l.isLunch ? l.qty : 0), 0);

  const addItem = (item: (typeof POS_CATALOG)[number]) =>
    setCart((c) => ({
      ...c,
      [item.name]: {
        name: item.name,
        price: item.price,
        isLunch: item.isLunch,
        qty: (c[item.name]?.qty ?? 0) + 1,
      },
    }));
  const removeItem = (name: string) =>
    setCart((c) => {
      const line = c[name];
      if (!line) return c;
      if (line.qty <= 1) {
        const { [name]: _drop, ...rest } = c;
        return rest;
      }
      return { ...c, [name]: { ...line, qty: line.qty - 1 } };
    });

  const confirm = () => {
    if (lines.length === 0) return;
    const { ticket, total: chargedTotal } = posSale(
      lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price, isLunch: l.isLunch })),
    );
    toast.success(`Ticket #${String(ticket).padStart(4, "0")} cobrado`, {
      description: money(chargedTotal),
    });
    setCart({});
    navigate({ to: "/app/dueno" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">
        <ScreenHeader
          eyebrow="CAJA ABIERTA"
          title="Registrar consumo"
          back="/app/dueno"
          action={
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary">
              <Receipt size={18} />
            </div>
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {POS_CATALOG.map((item) => (
            <PosItem
              key={item.name}
              image={item.image}
              name={item.name}
              price={money(item.price)}
              qty={cart[item.name]?.qty ?? 0}
              onAdd={() => addItem(item)}
            />
          ))}
        </div>
      </div>
      <div className="mt-auto rounded-t-[26px] bg-card-dark px-5 pb-6 pt-4 text-card-dark-foreground">
        {lines.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-card-dark-muted">
            Toca un producto para agregarlo al ticket.
          </p>
        ) : (
          <div className="max-h-[110px] space-y-1.5 overflow-y-auto no-scrollbar text-[10px]">
            {lines.map((l) => (
              <div
                key={l.name}
                className="grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2"
              >
                <span className="font-black text-lavender">{l.qty}×</span>
                <span className="truncate">{l.name}</span>
                <span className="font-bold">{money(l.qty * l.price)}</span>
                <button
                  type="button"
                  aria-label={`Quitar ${l.name}`}
                  onClick={() => removeItem(l.name)}
                  className="grid h-5 w-5 place-items-center rounded bg-background/10"
                >
                  <Minus size={12} className="text-card-dark-muted" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2.5 flex items-end justify-between border-t border-background/15 pt-2.5">
          <span className="text-[10px] text-card-dark-muted">
            Total
            {lunchCount > 0
              ? ` · ${lunchCount} ${lunchCount === 1 ? "almuerzo" : "almuerzos"}`
              : ""}
          </span>
          <span className="text-xl font-black">{money(total)}</span>
        </div>
        <div className="mt-3">
          <PaymentMethods selected={method} onSelect={setMethod} dark />
        </div>
        <PrimaryButton onClick={confirm} disabled={lines.length === 0}>
          <Banknote size={16} /> Cobrar {money(total)}
        </PrimaryButton>
      </div>
    </div>
  );
}

const PLAN_TYPES = ["Semanal", "Quincenal", "Mensual", "Libre"] as const;
type PlanType = (typeof PLAN_TYPES)[number];

// Valores sugeridos al elegir cada tipo de plan, para que "Semanal" no quede con precios de plan mensual.
const PLAN_PRESETS: Record<
  PlanType,
  { name: string; lunches: number; days: number; price: number }
> = {
  Semanal: { name: "Plan semanal", lunches: 5, days: 7, price: 15 },
  Quincenal: { name: "Plan quincenal", lunches: 10, days: 18, price: 28 },
  Mensual: { name: "Plan mensual ejecutivo", lunches: 20, days: 35, price: 52 },
  Libre: { name: "Plan personalizado", lunches: 12, days: 21, price: 32 },
};
const DEFAULT_PLAN_NAMES = new Set(Object.values(PLAN_PRESETS).map((p) => p.name));

// Acciones del dueño 5: configurar y publicar un plan nuevo.
export function NewPlanScreen({ initialType = "Mensual" }: { initialType?: PlanType }) {
  const { addPlan } = useBocadoo();
  const navigate = useNavigate();
  const initialPreset = PLAN_PRESETS[initialType];
  const [name, setName] = useState(initialPreset.name);
  const [type, setType] = useState<PlanType>(initialType);
  const [lunches, setLunches] = useState(initialPreset.lunches);
  const [days, setDays] = useState(initialPreset.days);
  const [price, setPrice] = useState(initialPreset.price);
  const [cupos, setCupos] = useState(40);

  // Al cambiar el tipo se sugieren sus valores típicos; si el dueño ya escribió un nombre propio, se respeta.
  const selectType = (next: PlanType) => {
    const preset = PLAN_PRESETS[next];
    setType(next);
    setLunches(preset.lunches);
    setDays(preset.days);
    setPrice(preset.price);
    setName((current) => (DEFAULT_PLAN_NAMES.has(current) ? preset.name : current));
  };
  const [activeDays, setActiveDays] = useState([true, true, true, true, true, false, false]);
  const [includes, setIncludes] = useState({
    Sopa: true,
    Segundo: true,
    Jugo: true,
    Postre: false,
  });
  const [visible, setVisible] = useState(true);
  const [autoRenew, setAutoRenew] = useState(false);

  const publish = () => {
    if (!name.trim() || lunches <= 0 || days <= 0 || price <= 0) {
      toast.error("Completa nombre, almuerzos, vigencia y precio para publicar el plan.");
      return;
    }
    addPlan({ type, name: name.trim(), lunches, price, days, clients: 0 } as Omit<
      Plan,
      "id" | "clients" | "active"
    >);
    toast.success("Plan publicado", { description: `${name.trim()} ya está disponible.` });
    navigate({ to: "/app/dueno/planes" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">
        <ScreenHeader
          eyebrow="LA CUCHARA DE SAN BLAS"
          title="Nuevo plan"
          back="/app/dueno/planes"
          action={<span className="text-[11px] font-extrabold text-primary">Borrador</span>}
        />
        <div className="relative mt-4 overflow-hidden rounded-[20px] bg-card-dark p-4 text-card-dark-foreground shadow-card">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-primary/40" />
          <p className="relative text-[8px] font-black text-lavender">
            VISTA PREVIA PARA COMENSALES
          </p>
          <div className="relative mt-2 flex items-end justify-between">
            <div>
              <p className="text-sm font-black">{name || "Nombre del plan"}</p>
              <p className="mt-0.5 text-[9px] text-card-dark-muted">
                {lunches} almuerzos · vigencia {days} días
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{money(price)}</p>
              <p className="text-[8px] text-lavender">
                {money(lunches > 0 ? price / lunches : 0)} c/u
              </p>
            </div>
          </div>
        </div>
        <FieldLabel>NOMBRE DEL PLAN</FieldLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex h-10 w-full items-center rounded-xl bg-muted px-3.5 text-[11px] font-semibold outline-none ring-primary focus:ring-2"
        />
        <FieldLabel>TIPO DE PLAN</FieldLabel>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 text-[9px] font-bold">
          {PLAN_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => selectType(t)}
              className={`rounded-[9px] py-2 text-center ${t === type ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stepper
            label="Almuerzos"
            value={String(lunches)}
            onDec={() => setLunches((v) => Math.max(1, v - 1))}
            onInc={() => setLunches((v) => v + 1)}
          />
          <Stepper
            label="Vigencia (días)"
            value={String(days)}
            onDec={() => setDays((v) => Math.max(1, v - 1))}
            onInc={() => setDays((v) => v + 1)}
          />
          <Stepper
            label="Precio del plan"
            value={money(price)}
            onDec={() => setPrice((v) => Math.max(1, v - 1))}
            onInc={() => setPrice((v) => v + 1)}
          />
          <Stepper
            label="Cupos disponibles"
            value={String(cupos)}
            onDec={() => setCupos((v) => Math.max(1, v - 1))}
            onInc={() => setCupos((v) => v + 1)}
          />
        </div>
        <FieldLabel>DÍAS DE CONSUMO</FieldLabel>
        <div className="flex justify-between">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <button
              type="button"
              key={`${d}-${i}`}
              onClick={() => setActiveDays((arr) => arr.map((v, idx) => (idx === i ? !v : v)))}
              className={`grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black ${activeDays[i] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {d}
            </button>
          ))}
        </div>
        <FieldLabel>EL ALMUERZO INCLUYE</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(includes) as Array<keyof typeof includes>).map((item) => {
            const on = includes[item];
            return (
              <button
                type="button"
                key={item}
                onClick={() => setIncludes((s) => ({ ...s, [item]: !s[item] }))}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[9px] font-bold ${on ? "bg-accent text-primary" : "border border-border text-muted-foreground"}`}
              >
                {on ? <Check size={11} strokeWidth={3} /> : <Plus size={11} />}
                {item}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-b border-border py-2">
          <div>
            <p className="text-[10px] font-extrabold">Visible en el marketplace</p>
            <p className="text-[8px] text-muted-foreground">
              Los comensales pueden comprarlo en la app
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visible}
            onClick={() => setVisible((v) => !v)}
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${visible ? "justify-end bg-primary" : "justify-start bg-muted-foreground/30"}`}
          >
            <i className="h-4 w-4 rounded-full bg-background shadow-soft" />
          </button>
        </div>
        <div className="flex items-center justify-between py-2 pb-4">
          <div>
            <p className="text-[10px] font-extrabold">Renovación automática</p>
            <p className="text-[8px] text-muted-foreground">
              Avisar al cliente 3 días antes de vencer
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoRenew}
            onClick={() => setAutoRenew((v) => !v)}
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${autoRenew ? "justify-end bg-primary" : "justify-start bg-muted-foreground/30"}`}
          >
            <i className="h-4 w-4 rounded-full bg-background shadow-soft" />
          </button>
        </div>
      </div>
      <div className="shrink-0 px-5 pb-7">
        <PrimaryButton onClick={publish}>
          <Check size={16} /> Guardar y publicar plan
        </PrimaryButton>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Gratis para publicar. Bocadoo cobra un porcentaje solo cuando se canjea la oferta.
        </p>
      </div>
    </div>
  );
}
