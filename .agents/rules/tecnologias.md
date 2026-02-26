---
trigger: always_on
---

### Stack por defecto

* Framework: **Next.js con App Router**
* UI: **Tailwind CSS**
* UI Icons: **Lucide React**
* Data: **Supabase-local**

## Reglas de Visualización
* **Librería principal:** Recharts + shadcn/ui.
* **La aplicación debe ser responsive, sobre todo el sidebar.
* **Estilo:** Usa siempre variables de color de Tailwind (`var(--chart-1)`, etc.).
* **Accesibilidad:** Todos los gráficos deben incluir `ChartTooltip` y etiquetas de accesibilidad.
* **Ubicación:** Los componentes de gráficas personalizados deben ir en `src/components/charts/`.