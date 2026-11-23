# Configuración de autenticación

Mesa Cerca usa Supabase Auth para correo/contraseña y Google.
React muestra los formularios; Supabase valida credenciales,
emite sesiones y gestiona contraseñas.

El backend desplegado en Supabase Edge Functions valida el token con
Supabase Auth antes de procesar cada búsqueda. La sesión del navegador
no sustituye esa validación.

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
- Desactivar Confirm email para permitir el registro sin verificación de correo.
- Establecer una longitud mínima de contraseña de 8 caracteres en el servidor, para que coincida con el formulario.
- En URL Configuration, usar como Site URL: `https://proyectodisenosoftware.vercel.app`.
- Mantener estas direcciones en Redirect URLs:
  - `http://localhost:5173`
  - `https://proyectodisenosoftware.vercel.app`

Ejecutar:

```sh
npm run dev -- --port 5173 --strictPort
```

Esto evita que Vite cambie silenciosamente a otro puerto
y fallen las redirecciones.

Esta entrega no verifica la propiedad del correo ni ofrece recuperación de
contraseña. No requiere configurar SMTP. Las contraseñas y las sesiones
siguen gestionadas por Supabase Auth.

Las cuentas antiguas con confirmación pendiente deben revisarse por separado;
no se debe asumir que el cambio de configuración las haya confirmado.

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
   Añadir estos orígenes autorizados:
   - `http://localhost:5173`
   - `https://proyectodisenosoftware.vercel.app`

   En las URI de redirección autorizadas, usar la URL de callback copiada de Supabase. Es la misma para el acceso local y publicado.
4. Copiar Client ID y Client Secret al proveedor Google
   de Supabase, habilitarlo y guardar.
5. Usar el botón «Continuar con Google» de Mesa Cerca
   y comprobar el retorno a la página.

El secreto OAuth se configura en Supabase, no en `.env.local`.
Este cliente OAuth es independiente de las claves de API de Maps/Places.

## 4. Configuración en Vercel

La aplicación está publicada en:
https://proyectodisenosoftware.vercel.app

En Settings → Environment Variables se configuran para Production las variables
públicas indicadas en `.env.example`.

Si se modifican las variables, hay que generar un nuevo despliegue para
incorporarlas a la compilación. Las comprobaciones están en [pruebas](pruebas.md).

Las URLs autorizadas en Supabase y Google permiten utilizar tanto la versión publicada como localhost durante el desarrollo. Los valores de las credenciales no se incluyen en esta documentación.

## Fuentes técnicas

- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/auth-smtp
