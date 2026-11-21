# Mesa Cerca

Aplicación web de recomendación de restaurantes.

Versión publicada: [Mesa Cerca](https://proyectodisenosoftware.vercel.app).



## Funcionalidades actuales

Las tarjetas con datos ficticios y sus detalles corresponden al modo
demostración. La búsqueda real utiliza Google Places y muestra los
datos disponibles del proveedor.

- Pantalla inicial adaptable a móvil, tablet y escritorio.
- Interfaz en español e inglés.
- Tarjetas reutilizables con restaurantes y precios ficticios.
- Niveles de precios de ejemplo con etiquetas en español e inglés.
- Búsqueda por nombre, sin distinguir mayúsculas ni tildes.
- Mensaje cuando no hay restaurantes que coincidan.
- Filtros por tipo de comida y nivel de precios combinados con la búsqueda.
- Botón para limpiar la búsqueda y los filtros.
- Detalles desplegables con dirección y horario ficticios en ambos idiomas.
- Formularios de acceso con Supabase: correo y contraseña, y Google.
- Estados de carga y mensajes de autenticación en español e inglés.
- Búsqueda local de restaurantes reales con filtros enviados al backend.
- Selección del punto de búsqueda en un mapa.
- Manejo de ubicación imprecisa, permisos denegados y errores de conexión.

La autenticación usa Supabase Auth. Para esta entrega se desactivó la confirmación de correo y se retiró la recuperación de contraseña. El registro no verifica la propiedad del correo y no requiere configurar SMTP. Las cuentas nuevas deben poder iniciar sesión inmediatamente después del registro.

En la versión publicada se comprobó el acceso con Google, la persistencia de la sesión al recargar y el cierre de sesión.

Se comprobó localmente el registro sin confirmación de correo, la persistencia
de sesión, el acceso con contraseña, el rechazo del registro duplicado y el
inicio con Google. Quedan pendientes la validación del nuevo registro en
producción y los demás casos sin marcar de la lista de pruebas.

El backend está desplegado en Supabase Edge Functions y conectado a Vercel. Se comprobó en producción que la búsqueda exige iniciar sesión, devuelve como máximo cinco restaurantes, conserva las coordenadas al cambiar los filtros y muestra los textos en inglés. Tras cerrar sesión, una nueva búsqueda solicita autenticación.

Próximas implementaciones planeadas: visualización de restaurantes en el mapa, completar la configuración y validación de autenticación, listas personales y recomendaciones.



## Tecnologías

- React y JavaScript para la interfaz.
- Vite para el entorno de desarrollo y la compilación.
- i18next y react-i18next para los textos en español e inglés.
- CSS para los estilos y la adaptación a distintos tamaños de pantalla.
- Supabase Auth para la autenticación.
- Deno y Google Places API (New) para el backend de búsqueda.
- Google Maps JavaScript API para seleccionar el punto de búsqueda.
- Supabase Edge Functions para alojar el backend y PostgreSQL para controlar los límites de búsqueda por usuario.



## Para ejecución local

Desde la carpeta del proyecto:

    npm install

Crear un archivo .env.local en la raíz del proyecto, tomando como referencia .env.example, y completar estas variables:

    VITE_SUPABASE_URL=
    VITE_SUPABASE_PUBLISHABLE_KEY=

Se debe usar la clave pública publishable de Supabase. No incluir claves secretas ni contraseñas de base de datos.

Iniciar el servidor:

    npm run dev -- --port 5173 --strictPort

Si se modifican las variables de entorno, es necesario reiniciar el servidor.

Los pasos para configurar Supabase y Google están en [la guía de autenticación](docs/autenticacion.md).


### Backend de búsqueda

Se incorpora un servidor local con Deno para consultar restaurantes mediante Google Places API (New).

El backend valida las coordenadas y los filtros. Solicita hasta veinte restaurantes dentro de un radio de tres kilómetros, ordenados por distancia, y devuelve un máximo de cinco después de aplicar los filtros de nombre y nivel de precio. También permite seleccionar el tipo de cocina.

Los filtros se aplican sobre los candidatos recibidos, por lo que la búsqueda no necesariamente incluye todas las coincidencias de la zona. Cuando Google no entrega el nivel de precio, se devuelve `null`. Esos restaurantes se excluyen si se selecciona un filtro de precio.



#### Configuración local

Se necesita Deno y una clave autorizada para Places API (New).

Crear `backend/.env.local` tomando como referencia
`backend/.env.example`:

```dotenv
GOOGLE_PLACES_API_KEY=tu_clave
```

El archivo `.env.local` está excluido de Git. La clave se utiliza
únicamente en el backend.

#### Comandos del backend

- `npm run backend`: inicia el servidor en `http://127.0.0.1:8000`.
- `npm run test:backend`: ejecuta las pruebas con respuestas simuladas,
  sin consultar Google.
- `npm run lint:backend`: revisa el código del backend.

#### Comprobaciones del backend

- Revisión estática sin errores.
- Nueve pruebas automatizadas aprobadas, que cubren validaciones, filtros, límite de resultados, consultas al proveedor, autenticación, límites de uso y manejo de errores.
- Consulta real con coordenadas de Santiago: respuesta HTTP 200
  y cinco restaurantes con direcciones y enlaces a Google Maps.

#### Uso del backend desplegado

Para utilizar la búsqueda real con Supabase Edge Functions, configurar en el archivo `.env.local` de la raíz:

```dotenv
VITE_REAL_SEARCH=true
VITE_USE_HOSTED_BACKEND=true
```

También deben estar configuradas la URL y la clave pública de Supabase.

En este modo solo se necesita ejecutar el servidor de la interfaz. La búsqueda requiere iniciar sesión y el backend valida al usuario antes de consultar Google Places.

Se permiten hasta diez búsquedas por minuto y cien por día por usuario. El límite diario se reinicia según la fecha UTC. Una búsqueda válida que llega a consultar al proveedor consume cuota aunque este falle.

La clave privada de Google Places se configura como secreto en Supabase y no se envía al navegador.

Para trabajar con el servidor local de Deno, utilizar `VITE_USE_HOSTED_BACKEND=false` y ejecutar tanto `npm run backend` como el servidor de la interfaz.

Se comprobó que una petición sin sesión recibe HTTP 401 y que una búsqueda desde la interfaz con sesión iniciada devuelve restaurantes mediante el backend desplegado.

El mapa requiere `VITE_GOOGLE_MAPS_API_KEY`, con una clave restringida a
Maps JavaScript API y a los sitios web autorizados. Esta clave de navegador
es distinta de la clave privada de Places utilizada por el backend.

El punto de búsqueda se conserva al cambiar los filtros mientras la página permanece abierta. Las ubicaciones automáticas con una incertidumbre superior a 1 km se rechazan y se ofrece seleccionar un punto en el mapa.

Se probó la selección de ubicación en el mapa y la conservación de las
coordenadas al cambiar los filtros. También se comprobaron el cambio del
punto de búsqueda, el rechazo de ubicaciones automáticas imprecisas,
los mensajes en ambos idiomas y el manejo del backend desconectado.


## Comprobaciones

Para pruebas y compilar:

    npm run lint
    npm test
    npm run build

Las pruebas automáticas comprueban que ambos idiomas tengan las mismas claves de traducción y que los errores de autenticación se conviertan en los mensajes correspondientes.

El registro y el inicio de sesión con contraseña o Google también requieren pruebas manuales con el servicio configurado. Los casos están en [la lista de pruebas](docs/pruebas-autenticacion.md).



## Sobre el uso de inteligencia artificial

Se utilizó ChatGPT para proponer código de autenticación, explicar la integración con Supabase y preparar traducciones, documentación y pruebas.

La configuración del proyecto de Supabase y la incorporación del código se realizaron manualmente. La revisión y las pruebas de los flujos completos de autenticación siguen en proceso.

Se utilizó ChatGPT como apoyo en la implementación del backend con Deno y Google Places, incluyendo propuestas de código, validaciones, manejo de errores y pruebas automatizadas. La integración y configuración se realizaron manualmente, y se comprobó el funcionamiento mediante pruebas y una consulta real a la API.

También se utilizó ChatGPT como apoyo para conectar la interfaz con el backend, incorporar la selección de ubicación en el mapa y preparar el manejo de errores y las pruebas automatizadas de búsqueda.

Se utilizó ChatGPT como apoyo para adaptar el backend a Supabase Edge Functions, implementar la validación de sesión y los límites de búsqueda, y preparar las pruebas correspondientes. La configuración de los servicios, el despliegue y las comprobaciones manuales se realizaron durante el desarrollo.
