# Configuración de autenticación

Mesa Cerca usa Supabase Auth para correo/contraseña y Google.
React muestra los formularios; Supabase valida credenciales,
emite sesiones y gestiona contraseñas.

El futuro backend Deno deberá validar el token en cada operación
privada. La sesión del navegador no sustituye esa validación.

## 1. Crear el proyecto de Supabase

1. Crear una cuenta y un proyecto en https://supabase.com/dashboard.
2. Elegir un nombre, región y contraseña de base de datos.
   Guardar esa contraseña fuera del repositorio; no se usa en React.
3. Obtener la Project URL y la clave publishable desde Connect
   o la configuración de API Keys.
4. Copiar `.env.example` como `.env.local` en la raíz del proyecto
   y completar ambos valores:

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU-CLAVE-PUBLISHABLE
```

Usar la clave publishable (`sb_publishable_...`), nunca una clave
secret (`sb_secret_...`), service_role, contraseña de base de datos
ni secreto OAuth.

Las variables con prefijo VITE_ son visibles en el navegador.
`.env.local` queda ignorado por Git.

Reiniciar Vite después de modificar las variables.

## 2. Configurar correo y redirecciones

En Authentication:

- Habilitar el proveedor Email y el registro de usuarios.
- Mantener la confirmación de correo habilitada.
- Establecer una longitud mínima de contraseña de 8 caracteres
  en el servidor, para que coincida con el formulario.
- En URL Configuration, usar `http://localhost:5173` como Site URL
  durante el desarrollo.
- Añadir a Redirect URLs:
  - `http://localhost:5173`
  - `http://localhost:5173/?auth=recovery`

Ejecutar:

```sh
npm run dev -- --port 5173 --strictPort
```

Esto evita que Vite cambie silenciosamente a otro puerto
y fallen las redirecciones.

El servicio de correo incluido solo envía a direcciones de miembros
del equipo de Supabase, con una cuota de prueba muy reducida
(la documentación consultada indica 2 mensajes/hora).

Para las primeras comprobaciones puede usarse tu propio correo
de la organización. Para usuarios externos, configurar Custom SMTP
en Supabase con un proveedor de correo y un remitente autorizado.

Guardar sus credenciales únicamente en Supabase.
No invitar usuarios finales al equipo administrativo para evitar
esta limitación.

Los correos automáticos usan las plantillas de Supabase.
El selector ES/EN traduce la interfaz web, no esas plantillas.
Se puede usar una plantilla bilingüe conservando los enlaces
y variables originales del proveedor.

## 3. Configurar Google

1. En Supabase, abrir Authentication → Sign In / Providers → Google
   y copiar la URL de callback que muestra el panel.
   Tiene una forma similar a:
   `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
2. En Google Cloud, seleccionar o crear un proyecto.
   Configurar Google Auth Platform / pantalla de consentimiento
   con nombre y correos de contacto.
   Si la aplicación está en pruebas, agregar las cuentas
   que participarán como usuarios de prueba.
3. Crear un cliente OAuth de tipo Web application.
   Añadir `http://localhost:5173` a los orígenes autorizados
   y la URL de callback copiada de Supabase a las URI
   de redirección autorizadas.
4. Copiar Client ID y Client Secret al proveedor Google
   de Supabase, habilitarlo y guardar.
5. Usar el botón «Continuar con Google» de Mesa Cerca
   y comprobar el retorno a la página.

El secreto OAuth se configura en Supabase, no en `.env.local`.
Este cliente OAuth es independiente de las futuras API keys
de Maps/Places.

## 4. Ejecutar y comprobar

```sh
npm install
npm run lint
npm test
npm run build
npm run dev -- --port 5173 --strictPort
```

Completar la lista de pruebas de `docs/pruebas-autenticacion.md`.
No considerar la integración terminada únicamente porque
la compilación pase.

Al desplegar:

- Establecer las dos variables públicas en el alojamiento.
- Cambiar Site URL a la dirección pública.
- Añadir las URLs de retorno de producción en Supabase:
  la raíz y `/?auth=recovery`.
- Agregar el origen público en Google.
- Conservar localhost solo mientras se necesite para desarrollar.

## Fuentes técnicas

- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/auth-smtp