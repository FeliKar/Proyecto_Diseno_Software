# Mesa Cerca

Aplicación web de recomendación de restaurantes.

Versión publicada: [Mesa Cerca](https://proyectodisenosoftware.vercel.app).



## Funcionalidades actuales

- Pantalla inicial adaptable a móvil, tablet y escritorio.
- Interfaz en español e inglés.
- Tarjetas reutilizables con restaurantes y precios ficticios.
- Niveles de precios de ejemplo con etiquetas en español e inglés.
- Búsqueda por nombre, sin distinguir mayúsculas ni tildes.
- Mensaje cuando no hay restaurantes que coincidan.
- Filtros por tipo de comida y nivel de precios combinados con la búsqueda.
- Botón para limpiar la búsqueda y los filtros.
- Detalles desplegables con dirección y horario ficticios en ambos idiomas.
- Formularios de acceso con Supabase: correo y contraseña, Google y recuperación.
- Estados de carga y mensajes de autenticación en español e inglés.

La autenticación usa Supabase Auth. Se probaron localmente el registro con confirmación de correo, el inicio con correo y contraseña y el acceso con Google.

En la versión publicada se comprobó el acceso con Google, la persistencia de la sesión al recargar y el cierre de sesión.

Quedan pendientes la recuperación de contraseña, los demás casos de prueba y la validación del registro e inicio con contraseña en producción.

Los restaurantes mostrados en la interfaz siguen siendo ficticios. El backend local ya permite consultar restaurantes reales mediante Google Places.

Próximas implementaciones planeadas: datos reales de restaurantes, mapas, completar la configuración y validación de autenticación, listas personales y recomendaciones.



## Tecnologías

- React y JavaScript para la interfaz.
- Vite para el entorno de desarrollo y la compilación.
- i18next y react-i18next para los textos en español e inglés.
- CSS para los estilos y la adaptación a distintos tamaños de pantalla.
- Supabase Auth para la autenticación.
- Deno y Google Places API (New) para el backend de búsqueda.



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
- Cinco pruebas automatizadas aprobadas, que cubren validaciones,
  filtros, límite de resultados, construcción de la consulta,
  manejo de errores y rechazo de orígenes no permitidos.
- Consulta real con coordenadas de Santiago: respuesta HTTP 200
  y cinco restaurantes con direcciones y enlaces a Google Maps.

La conexión con la interfaz y el despliegue del backend están pendientes.
La web todavía muestra restaurantes de demostración.


## Comprobaciones

Para pruebas y compilar:

    npm run lint
    npm test
    npm run build

Las pruebas automáticas comprueban que ambos idiomas tengan las mismas claves de traducción y que los errores de autenticación se conviertan en los mensajes correspondientes.

El registro, el inicio con Google y la recuperación de contraseña también requieren pruebas manuales con el servicio configurado. Los casos están en [la lista de pruebas](docs/pruebas-autenticacion.md).



## Sobre el uso de inteligencia artificial

Se utilizó ChatGPT para proponer código de autenticación, explicar la integración con Supabase y preparar traducciones, documentación y pruebas.

La configuración del proyecto de Supabase y la incorporación del código se realizaron manualmente. La revisión y las pruebas de los flujos completos de autenticación siguen en proceso.

Se utilizó ChatGPT como apoyo en la implementación del backend con Deno y Google Places, incluyendo propuestas de código, validaciones, manejo de errores y pruebas automatizadas. La integración y configuración se realizaron manualmente, y se comprobó el funcionamiento mediante pruebas y una consulta real a la API.