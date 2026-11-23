# Mesa Cerca

Proyecto individual de Diseño de Software: descubre restaurantes cercanos,
guarda tus lugares y recibe recomendaciones según tus búsquedas y valoraciones.

[Aplicación publicada](https://proyectodisenosoftware.vercel.app)

## Funcionalidades

- Acceso con Google o correo y contraseña mediante Supabase Auth.
- Interfaz en español e inglés con tres pantallas: Explorar, Mis listas y Mi cuenta.
  Navegación inferior en móvil y superior en escritorio.
- Ubicación del navegador o punto elegido en Google Maps.
- Filtros por tipo de comida y presupuesto; hasta cinco resultados dentro de tres kilómetros.
- Listas personales «Quiero visitar» y «Ya visité», con notas de 1 a 5.
- Recomendaciones basadas en búsquedas anteriores y valoraciones personales.
- Enlaces de listas de solo lectura, con opción de revocarlos.
- Tarjetas resumidas y ficha individual con fotos, reseñas y calificaciones de Google cuando están disponibles.

## Tecnologías y organización

React y CSS forman la interfaz; Vite ejecuta y compila el proyecto.
i18next gestiona las traducciones. Supabase proporciona autenticación,
PostgreSQL y funciones de backend con Deno. Google Maps y Places aportan
mapas y datos de restaurantes. El frontend está desplegado en Vercel.

| Carpeta | Responsabilidad |
|---|---|
| `src/components` | Interfaz, formularios y mapas |
| `src/lib` | Peticiones, sesión y validaciones del navegador |
| `src/locales` | Textos en español e inglés |
| `supabase/functions` | Autenticación de peticiones, permisos y consultas externas |
| `supabase/migrations` | Tablas, políticas RLS, permisos y cuota |
| `backend` | Servidor local básico y pruebas del backend |
| `tests` | Pruebas de los módulos de la interfaz |
| `docs` | Configuración de acceso y registro de pruebas |

## Ejecución local

Requisitos: Node.js con npm; Deno para validar y probar el backend.

```bash
npm install
```

Copiar `.env.example` como `.env.local` y completar:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
VITE_USE_HOSTED_BACKEND=true
VITE_GOOGLE_MAPS_API_KEY=TU_CLAVE_WEB
VITE_GOOGLE_MAPS_MAP_ID=TU_MAP_ID
```

```bash
npm run dev -- --port 5173 --strictPort
```

La interfaz local usa las funciones desplegadas. Reiniciar Vite al cambiar
variables. La versión final utiliza datos reales; el antiguo modo ficticio
se retiró y `VITE_REAL_SEARCH` ya no se usa.

Las variables `VITE_` son públicas. La clave web de Maps se restringe por sitios
permitidos y por API. La clave privada de Places se configura únicamente en
Supabase, nunca en el frontend. Los archivos `.env.local` están ignorados por Git.

La configuración de correo, Google y redirecciones está en
[autenticación](docs/autenticacion.md).

## Configurar un backend nuevo

1. Crear un proyecto Supabase y configurar Auth.
2. Ejecutar los archivos de `supabase/migrations` en orden de nombre en SQL Editor.
   Esto incluye la migración de permisos de lectura `202611220004_shared_list_read_access.sql`.
3. Crear `backend/.env.local` desde `backend/.env.example`, con la clave privada
   `GOOGLE_PLACES_API_KEY` habilitada para Places API (New).
4. Configurar ese secreto y desplegar las funciones:

```bash
npx supabase login
npx supabase secrets set --env-file backend/.env.local --project-ref TU_PROJECT_REF
npx supabase functions deploy restaurants --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy saved-restaurants --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy search-history --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy sharing --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy shared-list --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy restaurant-details --project-ref TU_PROJECT_REF --use-api
```

Las claves de servidor de Supabase las proporciona el entorno de Edge Functions.
En Vercel se configuran las mismas variables públicas de la interfaz y se despliega
desde GitHub. Los orígenes permitidos están en `supabase/functions/_shared/access.ts`;
al usar otro dominio hay que ajustar también Supabase Auth, OAuth y la clave web de Maps.

El comando `npm run backend` conserva un servidor local para búsquedas básicas
con `VITE_USE_HOSTED_BACKEND=false`. Las funcionalidades personales utilizan
Supabase; ese servidor no sustituye al backend desplegado.

## Navegación

Los enlaces `#restaurants`, `#saved-restaurants` y `#account` seleccionan las
tres pantallas sin recargar la aplicación ni perder el idioma. Atrás y Adelante
del navegador recorren esas secciones. La búsqueda se mantiene montada y oculta
al navegar, conservando filtros, ubicación y resultados. Los mapas se montan
solo cuando están visibles para evitar inicializarlos con tamaño cero.

Al iniciar sesión con contraseña se conservan los filtros y el punto elegido,
pero se descartan los resultados de invitado. El acceso con Google abandona
y recarga la aplicación: conserva la sesión de acceso, pero puede reiniciar
los filtros y la ubicación elegida. Al cerrar sesión o cambiar de cuenta se limpian los
filtros y resultados de la cuenta anterior. El login y las preferencias están
en Mi cuenta. Compartir listas y las preferencias opcionales de las notas se
abren solo cuando se necesitan. El mapa de resultados también se abre a petición.
Las estrellas usan botones de opción nativos, con etiquetas y validación de nota.

## Cómo funcionan las recomendaciones

El backend considera las últimas 20 búsquedas y hasta 20 locales calificados de
«Ya visité», ordenados por fecha de creación de su entrada. Cada filtro de búsqueda
aporta un punto. Cada nota personal aporta `nota - 3` a la comida y presupuesto
indicados por el usuario: 5 suma dos, 4 suma uno, 3 es neutral, 2 resta uno y 1 resta dos.

Se eligen por separado los filtros con mayor puntuación positiva. Un empate favorece
la búsqueda más reciente; sin búsquedas empatadas, se conserva el orden de los locales
calificados. Sin preferencias positivas se muestran opciones cercanas y se informa.
No se cambia la ubicación ni se amplía el radio si no hay resultados.

Pedir recomendaciones no alimenta el historial. Borrar búsquedas conserva las listas
y notas. Quitar una nota elimina su aporte; mover el local a «Quiero visitar» lo excluye
mientras permanezca allí. Es un algoritmo de reglas, no un modelo de aprendizaje automático.

## Datos, permisos y límites

- Las funciones privadas verifican la sesión en el servidor. Las políticas RLS
  restringen historial, listas, notas y enlaces a su propietario.
- La consulta pública de listas exige un enlace activo aleatorio. No devuelve
  correo, historial ni notas personales. Revocar impide nuevas consultas; no retira
  información que otra persona ya haya visto. Un enlace local solo funciona en ese equipo.
- La cuota compartida es de diez consultas por minuto y cien por día UTC por cuenta.
  Incluye búsquedas, páginas de listas, detalles y consultas de sus enlaces compartidos.
  Guardar notas o listas y administrar enlaces no consulta Google.
- Una consulta puede hacer varias llamadas a Google. La cuota de la aplicación
  no es un límite monetario; reseñas, resúmenes y fotos tienen facturación del proveedor.
- La búsqueda consulta hasta veinte candidatos y filtra por precio antes de devolver
  cinco. Puede omitir otros locales; los precios ausentes se excluyen al filtrar por precio.
- El navegador puede entregar una ubicación errónea: se rechaza incertidumbre superior
  a un kilómetro y se permite elegir el punto en el mapa. Eso no garantiza precisión absoluta.
- Se almacenan identificadores de lugares y datos propios del usuario. Los nombres,
  direcciones, fotos, reseñas y resúmenes de Google se consultan al solicitarlos.
- Google entrega hasta cinco reseñas por relevancia. El recuento de sus notas describe
  esa muestra, no una evolución temporal ni todas las opiniones. El resumen pertenece
  a Google/Gemini y se muestra con su divulgación y enlaces.
- Las fotos pueden mostrar comida o el local. Fotos, reseñas y resumen pueden faltar.
- El registro por contraseña no verifica la propiedad del correo y no ofrece recuperación.
  Google y Supabase gestionan las credenciales; las notas propias no se envían a Google Maps.

## Validación

```bash
npm run lint
npm test
npm run lint:backend
npm run test:backend
npm run build
```

Las pruebas automáticas utilizan respuestas simuladas. Las pruebas SQL de permisos
están en `supabase/*.test.sql`; requieren dos cuentas y revierten sus cambios.
El [registro consolidado](docs/pruebas.md) distingue lo comprobado antes de los
retoques de las comprobaciones finales pendientes en el navegador y Vercel.

## Fuentes y apoyo de IA

Se utilizó ChatGPT como apoyo para proponer y revisar código de interfaz y backend,
explicar Supabase y Google Places, preparar traducciones, documentación y pruebas,
y simplificar la presentación. La configuración de servicios, incorporación del código,
despliegue y pruebas manuales se realizaron durante el desarrollo. Los resúmenes de
reseñas los proporciona Google/Gemini y se identifican en la interfaz.

- [React](https://react.dev/learn)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [i18next](https://www.i18next.com/)
- [Google Maps JavaScript](https://developers.google.com/maps/documentation/javascript)
- [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [Resúmenes de reseñas](https://developers.google.com/maps/documentation/places/web-service/review-summaries/)
- [Atribuciones de Google Places](https://developers.google.com/maps/documentation/places/web-service/policies)

### Fichas de restaurantes

Las tarjetas muestran lo esencial. El nombre y «Ver detalles» abren una ficha
con dirección, precio, acceso a Google Maps, fotos y opiniones. Guardar, mover,
quitar y valorar se realizan desde esa ficha, según la sección de origen.
Volver conserva los resultados, filtros y página de la lista sin repetir su consulta.
Las fotos y reseñas se solicitan al abrir la ficha; cambiar el idioma requiere
pulsar «Actualizar detalles» para obtener nuevamente el contenido del proveedor.
La ficha depende de los resultados cargados en la sesión: al recargar o abrir su
URL directamente hay que volver a buscar o abrir la lista. Para compartir se usan
los enlaces de listas, que conservan su vista pública de solo lectura.

Las calificaciones de Google se muestran con cinco estrellas y su valor numérico.
La ficha incluye un carrusel de hasta cinco fotos, con flechas y deslizamiento táctil.
Se conservan los créditos y cada foto enlaza al original en Google Maps.
Abrir o actualizar la galería consume una unidad de la cuota de la aplicación,
pero puede generar una consulta de detalles y hasta cinco consultas de fotos a Google.
Recorrer las fotos ya cargadas no repite peticiones al backend. No se guardan imágenes
ni datos de Google en la base de datos o almacenamiento persistente del navegador.
