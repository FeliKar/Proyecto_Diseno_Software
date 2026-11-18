# Mesa Cerca

Aplicación web de recomendación de restaurantes.



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

La autenticación usa Supabase Auth. Se probaron localmente el registro con confirmación de correo, el inicio con correo y contraseña y el acceso con Google. Quedan pendientes la recuperación de contraseña, los demás casos de prueba y la validación en producción.

Los restaurantes y sus datos siguen siendo ficticios.

Próximas implementaciones planeadas: datos reales de restaurantes, mapas, completar la configuración y validación de autenticación, listas personales y recomendaciones.



## Tecnologías

- React y JavaScript para la interfaz.
- Vite para el entorno de desarrollo y la compilación.
- i18next y react-i18next para los textos en español e inglés.
- CSS para los estilos y la adaptación a distintos tamaños de pantalla.
- Supabase Auth para la autenticación.



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