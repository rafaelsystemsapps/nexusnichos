export const PAISES = [
  { value: "BR", label: "🇧🇷 Brasil", flag: "🇧🇷" },
  { value: "US", label: "🇺🇸 EUA", flag: "🇺🇸" },
  { value: "PT", label: "🇵🇹 Portugal", flag: "🇵🇹" },
  { value: "ES", label: "🇪🇸 Espanha", flag: "🇪🇸" },
  { value: "MX", label: "🇲🇽 México", flag: "🇲🇽" },
  { value: "AR", label: "🇦🇷 Argentina", flag: "🇦🇷" },
  { value: "UK", label: "🇬🇧 Reino Unido", flag: "🇬🇧" },
  { value: "outro", label: "🌍 Outro", flag: "🌍" },
];

export function paisInfo(code: string | null | undefined) {
  if (!code) return null;
  return PAISES.find((p) => p.value === code) ?? { value: code, label: code, flag: "🌍" };
}
