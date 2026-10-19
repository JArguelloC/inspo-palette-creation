// Servicio del menú del dueño. Hoy guarda en localStorage; para pasar a una API real
// basta con reemplazar el cuerpo de `loadMenu` y `saveMenu` por llamadas fetch.

import { useEffect, useState } from "react";

export type MenuSectionId = "jugo" | "sopa" | "fuerte" | "postre" | "adicional";

export const MENU_SECTIONS: Array<{ id: MenuSectionId; label: string }> = [
  { id: "jugo", label: "Jugo" },
  { id: "sopa", label: "Sopa" },
  { id: "fuerte", label: "Plato fuerte" },
  { id: "postre", label: "Postre" },
  { id: "adicional", label: "Adicional" },
];

/** Plato del menú del día. El precio es opcional porque normalmente va incluido en el almuerzo. */
export type MenuDish = { id: string; name: string; description: string; price?: number };

/** Plato a la carta: tiene precio propio y puede llevar foto (data URL reducida). */
export type SpecialDish = {
  id: string;
  name: string;
  description: string;
  price: number;
  photo?: string;
};

export type SavedMenu = {
  sections: Record<MenuSectionId, MenuDish[]>;
  specials: SpecialDish[];
  updatedAt: string;
};

const STORAGE_KEY = "bocadoo-menu-v1";

export const emptyMenu = (): SavedMenu => ({
  sections: { jugo: [], sopa: [], fuerte: [], postre: [], adicional: [] },
  specials: [],
  updatedAt: "",
});

export const newDishId = () =>
  `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export async function loadMenu(): Promise<SavedMenu | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedMenu>;
    const base = emptyMenu();
    return {
      sections: { ...base.sections, ...data.sections },
      specials: data.specials ?? [],
      updatedAt: data.updatedAt ?? "",
    };
  } catch {
    return null;
  }
}

/** Lanza un error si el navegador no deja guardar (por ejemplo, fotos demasiado pesadas). */
export async function saveMenu(menu: SavedMenu): Promise<void> {
  const data: SavedMenu = { ...menu, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Reduce la foto a un máximo de 480 px para que quepa en el almacenamiento del navegador. */
export function shrinkPhoto(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Menú guardado por el dueño; `null` mientras no exista uno. */
export function useSavedMenu() {
  const [menu, setMenu] = useState<SavedMenu | null>(null);
  useEffect(() => {
    loadMenu().then(setMenu);
  }, []);
  return menu;
}
