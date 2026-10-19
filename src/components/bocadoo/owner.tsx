import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  CreditCard,
  Eye,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Plus,
  ScanLine,
  Sparkles,
  Store,
  UserPlus,
  UserRound,
  Utensils,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import lunchImage from "@/assets/bocadoo-lunch.jpg";
import soupImage from "@/assets/bocadoo-soup.jpg";
import veggieImage from "@/assets/bocadoo-veggie.jpg";

import { MENU_SECTIONS, useSavedMenu } from "./menu-service";
import {
  DAILY_GOAL,
  initialsOf,
  money,
  moneyShort,
  normalizePhone,
  useBocadoo,
  type Plan,
} from "./store";
import {
  Avatar,
  BottomSheet,
  FieldLabel,
  ModalHeader,
  NavBar,
  Overlay,
  PrimaryButton,
  QuickAction,
  SecondaryButton,
  SectionTitle,
  SettingsRow,
  StatusBadge,
  Toggle,
  Transaction,
  TXN_ICONS,
} from "./ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TextField = ({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: typeof Mail;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) => (
  <>
    <FieldLabel>{label}</FieldLabel>
    <label
      className={`flex h-12 items-center gap-3 rounded-xl bg-muted px-4 text-xs text-foreground ring-primary focus-within:ring-2 ${error ? "ring-2 ring-danger" : ""}`}
    >
      <Icon size={16} className="shrink-0 text-primary" />
      {children}
    </label>
    {error && <p className="mt-1.5 text-[9px] font-bold text-danger">{error}</p>}
  </>
);

function AddClientModal({ onClose }: { onClose: () => void }) {
  const { findAppUser, findContact, clientForUser, addContact, linkUser } = useBocadoo();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Se revisa mientras se escribe para avisar antes de guardar un duplicado.
  const appUser = findAppUser(form.email, form.phone);
  const contact = appUser ? undefined : findContact(form.email, form.phone);
  const alreadyClient = appUser ? clientForUser(appUser.id) : undefined;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (submitted) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (form.name.trim().length < 3) next.name = "Escribe el nombre completo del cliente.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Ingresa un correo válido.";
    if (!/^0\d{9}$/.test(normalizePhone(form.phone)))
      next.phone = "Usa un celular de 10 dígitos, por ejemplo 0991234567.";
    setErrors(next);
    setSubmitted(true);
    return Object.keys(next).length === 0;
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (appUser || contact) return;
    if (!validate()) return;
    addContact(form);
    toast.success("Cliente guardado", {
      description: `${form.name.trim()} quedó en tu lista como Contacto sin plan.`,
    });
    onClose();
  };

  const link = () => {
    if (!appUser) return;
    if (linkUser(appUser))
      toast.success("Cliente vinculado", {
        description: `${appUser.name} ya aparece en tu lista de clientes.`,
      });
    else toast.info(`${appUser.name} ya es cliente de tu restaurante.`);
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <BottomSheet>
        <form onSubmit={save} noValidate>
          <ModalHeader
            icon={UserPlus}
            eyebrow="AGREGAR CLIENTE"
            title="Nuevo contacto"
            onClose={onClose}
          />
          <TextField icon={UserRound} label="NOMBRE COMPLETO" error={errors.name}>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Ej. Diego Salazar"
              autoComplete="name"
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </TextField>
          <TextField icon={Mail} label="CORREO ELECTRÓNICO" error={errors.email}>
            <input
              value={form.email}
              onChange={set("email")}
              type="email"
              inputMode="email"
              placeholder="cliente@email.com"
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </TextField>
          <TextField icon={Phone} label="TELÉFONO (WHATSAPP)" error={errors.phone}>
            <input
              value={form.phone}
              onChange={set("phone")}
              type="tel"
              inputMode="tel"
              placeholder="099 123 4567"
              autoComplete="tel"
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </TextField>
          <p className="mt-1.5 text-[9px] text-muted-foreground">
            Lo usaremos para avisarle por WhatsApp sobre su plan y el menú del día.
          </p>

          {appUser ? (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-accent/60 p-3 animate-in fade-in">
              <p className="flex items-center gap-1.5 text-[11px] font-black text-primary">
                <CircleAlert size={14} /> Este cliente ya está en la app
              </p>
              <div className="mt-2.5 grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-background p-2.5">
                <Avatar initials={initialsOf(appUser.name)} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold">{appUser.name}</p>
                  <p className="truncate text-[9px] text-muted-foreground">
                    @{appUser.username} · {appUser.email}
                  </p>
                </div>
                <StatusBadge status="Registrado" />
              </div>
              <p className="mt-2 text-[9px] text-muted-foreground">
                {alreadyClient
                  ? "Ya forma parte de tus clientes, no hace falta agregarlo de nuevo."
                  : "Vincúlalo a tu restaurante en lugar de crear un contacto duplicado."}
              </p>
            </div>
          ) : contact ? (
            <div className="mt-4 rounded-2xl bg-danger-soft p-3 animate-in fade-in">
              <p className="flex items-center gap-1.5 text-[11px] font-black text-danger">
                <CircleAlert size={14} /> Ya tienes este contacto
              </p>
              <p className="mt-1 text-[9px] text-muted-foreground">
                {contact.name} ya está guardado con ese correo o teléfono.
              </p>
            </div>
          ) : null}

          {appUser ? (
            <>
              <PrimaryButton onClick={alreadyClient ? onClose : link}>
                {alreadyClient ? (
                  <>
                    <Check size={15} /> Entendido
                  </>
                ) : (
                  <>
                    <Link2 size={15} /> Vincular a mis clientes
                  </>
                )}
              </PrimaryButton>
              <SecondaryButton onClick={() => setForm({ name: "", email: "", phone: "" })}>
                Registrar otra persona
              </SecondaryButton>
            </>
          ) : (
            <PrimaryButton type="submit" disabled={Boolean(contact)}>
              <UserPlus size={15} /> Guardar cliente
            </PrimaryButton>
          )}
        </form>
      </BottomSheet>
    </Overlay>
  );
}

export function OwnerHomeScreen({
  initialAddClientOpen = false,
}: {
  initialAddClientOpen?: boolean | undefined;
}) {
  const { activeClients, sales, servedToday, transactions, clients } = useBocadoo();
  const [addOpen, setAddOpen] = useState(initialAddClientOpen);
  const contacts = clients.filter((c) => !c.planId);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <header className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-foreground text-background">
              <Utensils size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold text-muted-foreground">
                LA CUCHARA DE SAN BLAS
              </p>
              <h2 className="truncate text-xl font-black">¡Hola, María!</h2>
            </div>
          </div>
          <Bell size={19} />
        </header>
        <div className="relative mt-6 overflow-hidden rounded-[24px] bg-primary p-5 text-primary-foreground shadow-brand">
          <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-lavender/30" />
          <p className="relative text-[9px] font-bold text-primary-soft">RESUMEN DE SEPTIEMBRE</p>
          <p className="relative mt-3 text-[32px] font-black leading-none">
            {activeClients} <span className="text-[17px]">clientes activos</span>
          </p>
          <div className="relative mt-3 flex items-center justify-between">
            <div>
              <p className="text-xl font-black">{moneyShort(sales)}</p>
              <p className="text-[9px] text-primary-soft">vendidos este mes</p>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-background px-3 py-2.5 text-[9px] font-extrabold text-foreground"
            >
              <Plus size={14} /> Agregar cliente
            </button>
          </div>
        </div>
        <div className="mt-5">
          <SectionTitle>Accesos rápidos</SectionTitle>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <QuickAction icon={CreditCard} label="Cobrar" to="/app/dueno/cobrar" />
          <QuickAction icon={ScanLine} label="Escanear QR / Descontar" to="/app/dueno/descontar" />
          <QuickAction
            icon={Utensils}
            label="Registrar consumo"
            to="/app/dueno/registrar-consumo"
          />
        </div>
        {contacts.length > 0 && (
          <>
            <div className="mt-6">
              <SectionTitle
                action={
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {contacts.length}
                  </span>
                }
              >
                Contactos sin plan
              </SectionTitle>
            </div>
            <div className="mt-1 divide-y divide-border">
              {contacts.map((c) => (
                <Link
                  key={c.id}
                  to="/app/dueno/cobrar"
                  search={{ cliente: c.id }}
                  className="grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 py-2.5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-[10px] font-black text-muted-foreground">
                    {initialsOf(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-extrabold">{c.name}</div>
                    <div className="mt-0.5 truncate text-[9px] text-muted-foreground">
                      {c.email} · {c.phone}
                    </div>
                  </div>
                  <span className="flex items-center gap-1">
                    <StatusBadge status="Sin plan" />
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className="mt-6">
          <SectionTitle
            action={<span className="text-[9px] font-bold text-primary">Ver todo</span>}
          >
            Historial de transacciones
          </SectionTitle>
        </div>
        <div className="mt-2 divide-y divide-border">
          {transactions.slice(0, 4).map((t) => (
            <Transaction
              key={t.id}
              icon={TXN_ICONS[t.icon]}
              name={t.name}
              detail={t.detail}
              value={t.value}
              positive={t.positive}
            />
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground">HOY</p>
              <p className="mt-1 text-sm font-black">{servedToday} almuerzos servidos</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-primary">
                {Math.round((servedToday / DAILY_GOAL) * 100)}%
              </p>
              <p className="text-[8px] text-muted-foreground">de la meta diaria</p>
            </div>
          </div>
        </div>
      </div>
      <NavBar active="Home" owner />
      {addOpen && <AddClientModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

const PlanCard = ({ plan, onToggle }: { plan: Plan; onToggle: () => void }) => (
  <div
    className={`rounded-2xl bg-card p-4 shadow-soft transition-opacity ${plan.active ? "" : "opacity-60"}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <span className="rounded-lg bg-accent px-2 py-1 text-[8px] font-black text-primary">
          {plan.type.toUpperCase()}
        </span>
        <p className="mt-2 text-lg font-black">{plan.lunches} almuerzos</p>
      </div>
      <Toggle on={plan.active} onToggle={onToggle} label={`Activar ${plan.name}`} />
    </div>
    <div className="mt-3 grid grid-cols-3 border-t border-border pt-3">
      <div>
        <p className="text-[8px] text-muted-foreground">Precio</p>
        <p className="mt-1 text-xs font-extrabold">{money(plan.price)}</p>
      </div>
      <div>
        <p className="text-[8px] text-muted-foreground">Vigencia</p>
        <p className="mt-1 text-xs font-extrabold">{plan.days} días</p>
      </div>
      <div>
        <p className="text-[8px] text-muted-foreground">Clientes</p>
        <p className="mt-1 text-xs font-extrabold">{plan.clients}</p>
      </div>
    </div>
  </div>
);

export function OwnerPlansScreen() {
  const { plans, togglePlan } = useBocadoo();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground">
              LA CUCHARA DE SAN BLAS
            </p>
            <h2 className="mt-1 text-[23px] font-black">Mis planes</h2>
          </div>
          <Link
            to="/app/dueno/planes/nuevo"
            aria-label="Agregar plan"
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus size={18} />
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onToggle={() => togglePlan(p.id)} />
          ))}
        </div>
        <div className="mt-5 rounded-[22px] border border-primary/20 bg-accent/60 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-black">Plan personalizado</h3>
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground">
            Arma una opción especial para tus clientes.
          </p>
          <p className="mt-4 text-[8px] font-bold text-muted-foreground">DÍAS INCLUIDOS</p>
          <div className="mt-2 flex justify-between">
            {["L", "M", "M", "J", "V", "S"].map((d, i) => (
              <span
                key={`${d}-${i}`}
                className={`grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black ${i < 5 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Almuerzos", "12"],
              ["Precio", "$32"],
              ["Expira", "21 días"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl bg-background p-2.5">
                <p className="text-[7px] text-muted-foreground">{a}</p>
                <p className="mt-1 text-[10px] font-black">{b}</p>
              </div>
            ))}
          </div>
          <Link
            to="/app/dueno/planes/nuevo"
            search={{ tipo: "Libre" }}
            className="mt-4 block rounded-xl bg-foreground py-3 text-center text-[10px] font-bold text-background"
          >
            Crear plan
          </Link>
        </div>
      </div>
      <NavBar active="Planes" owner />
    </div>
  );
}

const Dish = ({
  title,
  name,
  image,
  description,
  price,
  soldOut = false,
}: {
  title: string;
  name: string;
  image?: string | undefined;
  description?: string | undefined;
  price?: number | undefined;
  soldOut?: boolean;
}) => (
  <div className={`overflow-hidden rounded-2xl bg-card shadow-soft ${soldOut ? "opacity-60" : ""}`}>
    {image && (
      <img
        src={image}
        alt={name}
        loading="lazy"
        width={896}
        height={752}
        className="h-[90px] w-full object-cover"
      />
    )}
    <div className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-black text-primary">{title.toUpperCase()}</span>
        {soldOut && (
          <span className="rounded-md bg-danger-soft px-1.5 py-1 text-[7px] font-black text-danger">
            AGOTADO
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] font-extrabold">{name}</p>
      {description && (
        <p className="mt-0.5 text-[9px] leading-snug text-muted-foreground">{description}</p>
      )}
      {price !== undefined && (
        <p className="mt-1 text-[10px] font-black text-primary">{money(price)}</p>
      )}
      <div className="mt-2 flex items-center gap-1 text-[8px] text-muted-foreground">
        <Check size={11} /> Disponible hoy
      </div>
    </div>
  </div>
);

export function OwnerMenuScreen() {
  const [drink, setDrink] = useState(true);
  // Si el dueño guardó un menú, reemplaza a los platos de ejemplo.
  const saved = useSavedMenu();
  const savedDishes = saved
    ? MENU_SECTIONS.filter((s) => s.id !== "jugo").flatMap((s) =>
        saved.sections[s.id].map((dish) => ({ ...dish, title: s.label })),
      )
    : [];
  const savedJuices = saved?.sections.jugo.map((d) => d.name).join(" · ");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground">MENÚ DEL DÍA</p>
            <h2 className="mt-1 text-[22px] font-black">Miércoles 30</h2>
            <p className="text-[10px] text-muted-foreground">Septiembre · 2026</p>
          </div>
          <div className="flex gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
              <CalendarDays size={20} />
            </div>
            <Link
              to="/app/dueno/agregar-menu"
              aria-label="Agregar menú"
              className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand outline-none ring-primary ring-offset-2 focus-visible:ring-2"
            >
              <Plus size={20} strokeWidth={2.6} />
            </Link>
          </div>
        </div>
        {saved ? (
          savedDishes.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {savedDishes.map((d) => (
                <Dish
                  key={d.id}
                  title={d.title}
                  name={d.name}
                  description={d.description}
                  price={d.price}
                />
              ))}
            </div>
          )
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Dish title="Sopa" name="Locro de papa" image={soupImage} />
            <Dish title="Segundo" name="Pollo a la plancha" image={lunchImage} />
            <Dish title="Opción veggie" name="Bowl de quinoa" image={veggieImage} />
            <Dish title="Postre" name="Higos con queso" image={soupImage} soldOut />
          </div>
        )}
        <div className="mt-4 rounded-2xl bg-muted p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-bold text-muted-foreground">BEBIDA DE HOY</p>
              <p className="mt-1 text-[11px] font-extrabold">
                {savedJuices || "Jugo de naranjilla"}
              </p>
            </div>
            <Toggle on={drink} onToggle={() => setDrink((v) => !v)} label="Bebida disponible" />
          </div>
        </div>
        {saved && saved.specials.length > 0 && (
          <>
            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-sm font-black">Platos a la carta</h3>
              <Link to="/app/dueno/agregar-menu" className="text-[9px] font-bold text-primary">
                Editar
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {saved.specials.map((d) => (
                <Dish
                  key={d.id}
                  title="A la carta"
                  name={d.name}
                  image={d.photo}
                  description={d.description}
                  price={d.price}
                />
              ))}
            </div>
          </>
        )}
        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-black">Menú de la semana</h3>
          <span className="text-[9px] font-bold text-primary">Editar</span>
        </div>
        <div className="mt-3 flex gap-2">
          {[
            ["LUN", "Seco de pollo"],
            ["MAR", "Fritada"],
            ["MIÉ", "Pollo grill"],
          ].map(([day, meal], i) => (
            <div
              key={day}
              className={`w-[104px] shrink-0 rounded-xl p-3 ${i === 2 ? "bg-primary text-primary-foreground" : "bg-card shadow-soft"}`}
            >
              <p
                className={`text-[8px] font-black ${i === 2 ? "text-primary-soft" : "text-muted-foreground"}`}
              >
                {day}
              </p>
              <p className="mt-2 text-[9px] font-extrabold leading-tight">{meal}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            toast.success("Menú publicado", {
              description: "Tus clientes ya pueden ver el menú de hoy.",
            })
          }
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-xs font-extrabold text-background"
        >
          <Eye size={16} /> Publicar menú
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Gratis para publicar. Bocadoo cobra un porcentaje solo cuando se canjea la oferta.
        </p>
      </div>
      <NavBar active="Menú" owner />
    </div>
  );
}

export function OwnerSettingsScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="mt-4 text-[23px] font-black">Ajustes</h2>
        <div className="mt-4 flex items-center gap-4 rounded-[24px] bg-foreground p-4 text-background">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Utensils size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-bold text-lavender">MI RESTAURANTE</p>
            <h3 className="mt-1 text-sm font-black leading-tight">La Cuchara de San Blas</h3>
            <p className="mt-1 text-[8px] text-card-dark-muted">
              Editar perfil <Pencil size={8} className="inline" />
            </p>
          </div>
        </div>
        <p className="mb-1 mt-4 text-[9px] font-black text-muted-foreground">NEGOCIO</p>
        <SettingsRow icon={Store} label="Datos del restaurante" />
        <SettingsRow icon={Clock3} label="Dirección y horarios" />
        <SettingsRow icon={Pencil} label="Editar nombre" />
        <SettingsRow icon={CreditCard} label="Métodos de cobro" />
        <p className="mb-1 mt-3 text-[9px] font-black text-muted-foreground">CUENTA Y SOPORTE</p>
        <SettingsRow icon={Mail} label="Cambiar correo" />
        <SettingsRow icon={LockKeyhole} label="Cambiar contraseña" />
        <SettingsRow icon={Bell} label="Notificaciones" />
        <SettingsRow icon={CircleHelp} label="Ayuda y soporte" />
        <SettingsRow icon={LogOut} label="Cerrar sesión" danger to="/app" />
      </div>
      <NavBar active="Ajustes" owner />
    </div>
  );
}
