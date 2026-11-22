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
- Mensaje cuando no hay restaurantes que coincidan.
- Búsqueda por ubicación con filtros por tipo de comida y nivel de precios.
- Botón para limpiar los filtros.
- Detalles desplegables con dirección y horario ficticios en ambos idiomas.
- Formularios de acceso con Supabase: correo y contraseña, y Google.
- Estados de carga y mensajes de autenticación en español e inglés.
- Búsqueda local de restaurantes reales con filtros enviados al backend.
- Selección del punto de búsqueda en un mapa.
- Listas personales «Quiero visitar» y «Ya visité», con opciones para mover o quitar restaurantes.
- Calificación y cantidad de valoraciones de Google, cuando están disponibles.
- Mapa de resultados con marcadores numerados que corresponden a las tarjetas.
- Manejo de ubicación imprecisa, permisos denegados y errores de conexión.

La autenticación usa Supabase Auth. Para esta entrega se desactivó la confirmación de correo y se retiró la recuperación de contraseña. El registro no verifica la propiedad del correo y no requiere configurar SMTP. Las cuentas nuevas deben poder iniciar sesión inmediatamente después del registro.

En la versión publicada se comprobó el acceso con Google, la persistencia de la sesión al recargar y el cierre de sesión.

Se comprobó el registro sin confirmación y el acceso con contraseña o Google en localhost y en producción. También se probaron las validaciones, los errores de conexión, ambos idiomas y la usabilidad de los formularios.

El backend está desplegado en Supabase Edge Functions y conectado a Vercel. Se comprobó en producción que la búsqueda exige iniciar sesión, devuelve como máximo cinco restaurantes, conserva las coordenadas al cambiar los filtros y muestra los textos en inglés. Tras cerrar sesión, una nueva búsqueda solicita autenticación.

Pendientes de cierre: validación en producción, retoques de interfaz y documentación, y repaso técnico.



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

El backend valida las coordenadas y los filtros. Solicita hasta veinte restaurantes dentro de un radio de tres kilómetros, ordenados por distancia, y devuelve un máximo de cinco después de aplicar el filtro de nivel de precio. También permite seleccionar el tipo de cocina.

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
- Pruebas automatizadas aprobadas, que cubren validaciones, filtros, límite de resultados, consultas al proveedor, autenticación, límites de uso y manejo de errores.
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

Se permiten hasta diez consultas por minuto y cien por día por usuario, compartidas entre búsquedas y apertura de páginas de listas. El límite diario se reinicia según la fecha UTC. Una búsqueda válida que llega a consultar al proveedor consume cuota aunque este falle.

La clave privada de Google Places se configura como secreto en Supabase y no se envía al navegador.

Para trabajar con el servidor local de Deno, utilizar `VITE_USE_HOSTED_BACKEND=false` y ejecutar tanto `npm run backend` como el servidor de la interfaz.

Se comprobó que una petición sin sesión recibe HTTP 401 y que una búsqueda desde la interfaz con sesión iniciada devuelve restaurantes mediante el backend desplegado.

El mapa requiere `VITE_GOOGLE_MAPS_API_KEY`, con una clave restringida a
Maps JavaScript API y a los sitios web autorizados. Esta clave de navegador
es distinta de la clave privada de Places utilizada por el backend.

El mapa de resultados requiere también `VITE_GOOGLE_MAPS_MAP_ID` en la raíz
local y en Vercel. Se obtiene creando un Map ID de tipo JavaScript en Google
Cloud. Es un identificador público, no una clave secreta. Reiniciar Vite o
volver a compilar en Vercel después de configurarlo.

Los marcadores muestran el número de la tarjeta; al pulsarlos aparece el
nombre del restaurante. Mover el mapa de resultados no modifica la ubicación
de búsqueda. Si faltan coordenadas, el restaurante permanece en la lista.
Las calificaciones son las de Google, no notas propias de los usuarios.

Se comprobaron desde localhost las calificaciones, la cantidad de valoraciones
y los marcadores numerados con el backend desplegado. Los marcadores coinciden
con las tarjetas y muestran el nombre del restaurante al pulsarlos. También
se verificaron los filtros, ambos idiomas y que mover el mapa de resultados
no modifica el punto de búsqueda.

El punto de búsqueda se conserva al cambiar los filtros mientras la página permanece abierta. Las ubicaciones automáticas con una incertidumbre superior a 1 km se rechazan y se ofrece seleccionar un punto en el mapa.

Se probó la selección de ubicación en el mapa y la conservación de las
coordenadas al cambiar los filtros. También se comprobaron el cambio del
punto de búsqueda, el rechazo de ubicaciones automáticas imprecisas,
los mensajes en ambos idiomas y el manejo del backend desconectado.

Se comprobó la búsqueda sin filtro de nombre, la combinación de tipo de
comida y precio, la limpieza de filtros conservando la ubicación y los
textos en ambos idiomas, desde localhost con el backend desplegado en Supabase.

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

Se utilizó ChatGPT como apoyo para implementar las listas, sus permisos,
la consulta de datos actuales y las pruebas correspondientes.

Se utilizó ChatGPT como apoyo para los controles de valoración, la integración
con la base de datos, las reglas de recomendación y las pruebas.

Se utilizó ChatGPT como apoyo para compartir listas, comprobar sus permisos,
reutilizar la consulta de detalles y preparar las pruebas.

Se utilizó ChatGPT como apoyo para conectar las fotos y reseñas de Google,
mostrar las atribuciones, preparar el recuento de la muestra y sus pruebas.
El resumen mostrado pertenece al proveedor y se identifica como tal.




## Listas personales

La tabla `saved_restaurants` guarda el identificador de Google, el usuario,
el estado (`wishlist` o `visited`) y la fecha de creación. Su clave primaria
evita duplicar un restaurante para el mismo usuario. Las reglas RLS impiden
leer o modificar filas de otras cuentas.

El backend `saved-restaurants` valida la sesión y usa el token del usuario
para consultar la base de datos, manteniendo activas sus reglas RLS.
Los nombres y direcciones se obtienen de Google Places al abrir la lista;
no se guardan en la tabla. Cada página muestra hasta cinco restaurantes y
puede realizar hasta cinco consultas de Place Details. No se consulta Google
al guardar, mover o quitar una entrada. Estas modificaciones no consumen
la cuota de consultas a Google de la aplicación.

Para configurar las listas:

1. Ejecutar `supabase/migrations/202611210001_saved_restaurants.sql` en SQL Editor.
2. Desplegar las funciones `restaurants` y `saved-restaurants`.
3. Mantener las claves ya configuradas en Supabase y en la interfaz.

```bash
npx supabase functions deploy restaurants --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy saved-restaurants --project-ref TU_PROJECT_REF --use-api
```

Las listas funcionan contra Supabase incluso al ejecutar la interfaz en
localhost. No se necesitan nuevas claves ni variables de entorno.
Si falla Google, se conserva la entrada para poder moverla o quitarla.
Cerrar sesión o cambiar de cuenta descarta las listas mostradas en pantalla.

Las pruebas automáticas usan respuestas simuladas. También se ejecutó la prueba SQL de permisos y se completaron las pruebas manuales de listas con el proyecto real, incluyendo la separación de datos entre usuarios


## Historial y recomendaciones por búsquedas

El backend registra los filtros de las búsquedas que terminan correctamente,
incluso si no hay resultados. No guarda coordenadas ni datos de Google en
`search_history`. Cada cuenta puede consultar o borrar su propio historial.
El historial se utiliza internamente para las recomendaciones y no se muestra
como una lista en la interfaz. En «Preferencias de recomendaciones» se puede
borrar para empezar de nuevo, previa confirmación. Las listas de restaurantes
se conservan. Las entradas anteriores a las últimas 20 permanecen almacenadas
hasta borrar el historial, aunque no intervienen en el cálculo.

El botón de recomendaciones toma las últimas 20 búsquedas y calcula en el
backend preferencias de comida y presupuesto, por separado, combinándolas
con las valoraciones personales. Los
filtros vacíos no cuentan como preferencia. En caso de empate se usa el valor
más reciente. Se conserva la ubicación elegida, el radio de tres kilómetros
y el máximo de cinco restaurantes ordenados por cercanía. El formulario
mantiene sus filtros para búsquedas manuales; las recomendaciones indican
cuáles se utilizaron realmente.

Sin búsquedas ni valoraciones, o sin preferencias con puntuación positiva,
se muestran opciones cercanas y
se explica la falta de personalización. Un resultado vacío no amplía el radio
ni cambia de ciudad. Pedir recomendaciones no agrega búsquedas al historial,
para evitar que el algoritmo refuerce sus propias elecciones.

Si falla el guardado del historial se conservan los resultados y se muestra
un aviso. Si falla su lectura, la recomendación informa un error. Las búsquedas
y recomendaciones comparten la cuota existente; consultar o borrar historial
no llama a Google.

Las recomendaciones combinan este historial con las valoraciones personales
descritas a continuación.

Configuración:

1. Ejecutar `supabase/migrations/202611220001_search_history.sql`.
2. Desplegar `restaurants` y `search-history`.
3. Usar `VITE_USE_HOSTED_BACKEND=true`, con las variables existentes.

```bash
npx supabase functions deploy restaurants --project-ref TU_PROJECT_REF --use-api
npx supabase functions deploy search-history --project-ref TU_PROJECT_REF --use-api
```

No se agregan dependencias, claves ni variables de entorno. El servidor Deno
local sigue ofreciendo búsquedas básicas sin persistencia de historial.

Las pruebas con respuestas simuladas cubren preferencias, autenticación,
identidad al acceder a la base de datos y fallos del proveedor o del historial.
Se ejecutó la prueba SQL de permisos y se completaron las pruebas manuales de recomendaciones, incluyendo persistencia, separación entre cuentas, borrado de preferencias, manejo de errores y textos en ambos idiomas.
según `docs/pruebas-historial.md`.


## Valoraciones personales

En «Ya visité» se puede guardar, modificar o quitar una nota de 1 a 5. El tipo
de comida y presupuesto son opcionales y los indica el usuario según su
experiencia; no son datos copiados de Google. Una nota sin categoría ni
presupuesto no modifica esos filtros de recomendación.

Los valores se guardan en `saved_restaurants`, en `user_rating`,
`user_category` y `user_price_level`, con los permisos por usuario existentes.
El backend solo permite calificar una entrada propia de «Ya visité». Una
entrada inexistente o inaccesible no se presenta como guardada correctamente.
Guardar valoraciones no consulta Google ni consume cuota de búsquedas.

Para recomendar se consideran las últimas 20 búsquedas y hasta 20 locales
calificados de «Ya visité», ordenados por fecha de creación de la entrada.
Cada búsqueda aporta un punto a cada filtro específico. Cada valoración
aporta `nota - 3`: 5 suma dos puntos, 4 suma uno, 3 es neutral, 2 resta uno y
1 resta dos. Se elige por separado la categoría y el presupuesto con mayor
puntuación positiva. Los empates favorecen la búsqueda más reciente; si no
hay búsquedas empatadas, se conserva el orden de las entradas calificadas.

Ejemplo: una búsqueda italiana suma un punto a italiana. Una valoración de
5 en mariscos suma dos a mariscos, por lo que se elige mariscos. El resultado
es una preferencia de filtros, no una predicción de la calidad del local.
Se mantienen el punto elegido, el radio y el orden por cercanía.

Quitar una valoración elimina su aporte. Mover un local a «Quiero visitar»
conserva la nota, pero la excluye del cálculo mientras permanezca allí.
Borrar el historial de búsquedas conserva listas y valoraciones. Para ver
cambios en los resultados hay que solicitar nuevas recomendaciones.
Si no se pueden leer las valoraciones se informa un error, sin asumir que
el usuario no tiene datos.

Configuración: ejecutar `supabase/migrations/202611220002_personal_ratings.sql`
y desplegar de nuevo las funciones `restaurants` y `saved-restaurants`.
No se agregan claves, variables ni dependencias.

Las pruebas automáticas cubren validaciones, identidad de usuario,
actualización de notas, combinación de preferencias y fallos de acceso.
Queda ejecutar `supabase/personal-ratings.test.sql` y completar
`docs/pruebas-valoraciones.md` con el proyecto real.



## Compartir listas

Cada lista tiene un enlace de solo lectura que su propietario puede generar
o revocar. Los enlaces usan un UUID aleatorio y se guardan en `shared_lists`.
La tabla tiene RLS y solo permite a cada cuenta administrar sus propios enlaces.
Generar un enlace existente lo conserva; dejar de compartir lo elimina.
Al compartir de nuevo se obtiene otro identificador.

La interfaz añade `?list=IDENTIFICADOR` a la dirección de la aplicación.
Quien recibe el enlace puede abrirlo sin cuenta y pulsar «Ver lista».
La vista refleja el contenido actual y muestra hasta cinco locales por página,
con nombres y direcciones obtenidos de Google. Los enlaces de cada local
permiten abrirlo o compartirlo desde Google Maps.

La función `sharing` exige sesión y usa los permisos de la cuenta para crear
o revocar enlaces. La función pública `shared-list` busca primero el enlace
activo en el servidor y consulta únicamente la cuenta y el tipo de lista
asociados. Utiliza una clave de servidor de Supabase ya disponible en el
entorno de Edge Functions; nunca se incorpora al frontend. La respuesta pública
incluye solo identificador de local, nombre, dirección, enlace a Maps y
atribuciones. No devuelve usuario, correo, historial ni valoraciones personales.

Cada consulta válida a una página compartida consume una unidad de la cuota
existente de la cuenta propietaria, compartida con sus búsquedas y consultas
de listas: diez por minuto y cien por día UTC. Puede consultar hasta cinco
detalles de Google. Crear o revocar enlaces no consulta Google. Un enlace
inválido o revocado no consulta restaurantes ni consume esta cuota.

Revocar impide nuevas consultas; no puede retirar información que otra persona
ya haya visto o copiado. El receptor puede reenviar el enlace mientras esté
activo. Las vistas no usan caché HTTP.

Configuración:

1. Ejecutar `supabase/migrations/202611220003_shared_lists.sql`.
2. Ejecutar `supabase/migrations/202611220004_shared_list_read_access.sql`.
3. Desplegar `sharing`, `shared-list` y `saved-restaurants`.
4. Publicar los cambios del frontend mediante Vercel.

No se requieren nuevas variables, claves de Google ni dependencias. Para enviar
un enlace a otra persona se debe generarlo desde la dirección pública de Vercel;
un enlace de localhost solo funciona en el equipo donde se ejecuta la aplicación.

Las pruebas automáticas cubren permisos, lectura pública limitada, revocación, protección de campos privados, errores y cuotas. Se ejecutó la prueba SQL de permisos y se completaron las pruebas manuales de listas compartidas, incluyendo acceso sin sesión, separación de datos privados, paginación y revocación de enlaces. También se corrigieron los permisos de lectura del backend.

## Fotos, reseñas y resumen

Los resultados de búsqueda y las listas personales ofrecen «Ver fotos y reseñas».
La función `restaurant-details` exige una sesión válida y aplica la cuota de
consultas existente antes de llamar a Google Places. La carga es explícita:
no se consultan detalles adicionales para todas las tarjetas automáticamente.
Los enlaces compartidos mantienen su vista pública de solo lectura.

Se solicita la calificación global, el número de opiniones, hasta cinco reseñas
seleccionadas por relevancia por Google y `reviewSummary`. El resumen lo genera
Google, puede faltar y se muestra completo junto con su divulgación original
de Gemini y sus enlaces de información, fuente y reporte. No requiere otra
clave de IA. El backend calcula únicamente el recuento de notas de la muestra:
4–5, 3 y 1–2. No debe interpretarse como distribución de todas las opiniones
ni como evolución temporal de las calificaciones.

Las reseñas incluyen atribución del autor, perfil, avatar y enlaces cuando
Google los proporciona. Si el texto difiere del original, este puede consultarse
sin traducirlo con otra API. Los textos de interfaz siguen en archivos de idioma.

Cada consulta recupera referencias actuales de fotos y puede obtener una imagen
de hasta 900 píxeles de ancho. «Otra foto» recorre hasta tres fotos disponibles,
volviendo a pedir detalles actuales. La clave de Google permanece en el backend;
al navegador solo llega la dirección temporal de la imagen y sus atribuciones.
Google no proporciona en estos metadatos una clasificación fiable de comida
frente a edificio: puede mostrarse cualquiera. No se añaden clasificadores ni
se afirma que la imagen sea de un plato.

No se guardan fotos, reseñas, referencias de imágenes o resúmenes en Supabase
ni en almacenamiento local. Los datos se conservan en memoria mientras están
abiertos los detalles; cerrarlos descarta la respuesta. Un fallo de imagen no
oculta las reseñas disponibles. Se manejan locales retirados, datos ausentes,
cuotas, tiempos de espera y errores del proveedor.

Cada apertura, actualización o cambio de foto consume una unidad de la cuota
existente de la cuenta. Puede realizar una consulta Place Details y otra
Place Photos. Los campos `reviews` y `reviewSummary` utilizan un nivel de
facturación de Google superior al de datos básicos; no se presupone que estas
consultas sean gratuitas. El límite de la aplicación controla solicitudes,
no equivale a un límite monetario del proyecto de Google.

Configuración: desplegar `restaurant-details`. No se requieren migraciones,
dependencias ni nuevas variables o claves. La misma clave privada existente
debe tener acceso a Places API (New).

```bash
npx supabase functions deploy restaurant-details --project-ref TU_PROJECT_REF --use-api
```

Fuentes técnicas:

- [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [Resúmenes de reseñas](https://developers.google.com/maps/documentation/places/web-service/review-summaries/)
- [Atribuciones](https://developers.google.com/maps/documentation/places/web-service/policies)

Las pruebas automáticas cubren sesión, cuota, datos opcionales, atribuciones y errores del proveedor. También se completaron las pruebas manuales de fotos, reseñas y resúmenes con la función desplegada. Queda comprobar la versión publicada en Vercel tras este commit.