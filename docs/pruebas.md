# Registro de pruebas

## Comprobado antes de los retoques finales

Registro consolidado de las comprobaciones manuales realizadas durante el desarrollo.
Las respuestas simuladas de las pruebas automáticas no sustituyen estas comprobaciones.

- [x] Registro con correo y contraseña, acceso con Google, persistencia y cierre de sesión.
- [x] Validaciones de formularios, credenciales incorrectas, cancelación de Google y fallos de conexión.
- [x] Búsquedas con ubicación elegida, comida y presupuesto, máximo de cinco locales y mapa numerado.
- [x] Listas: guardar sin duplicados, recargar, mover, quitar, paginar y separar entre cuentas.
- [x] Recomendaciones sin historial, frecuencias, empates, valoraciones y borrado de búsquedas.
- [x] Notas personales: guardar, modificar, quitar, persistir y mantener privadas entre cuentas.
- [x] Enlaces: acceso sin sesión, contenido actual, paginación, revocación y regeneración.
- [x] Fotos y reseñas: disponibilidad, autores, fuentes, resumen cuando existe y manejo de datos ausentes.
- [x] Cambio de idioma y uso en pantalla pequeña en las funcionalidades implementadas.
- [x] Pruebas SQL de listas, historial, valoraciones y enlaces compartidos sin errores.

## Comprobaciones finales tras los retoques

Marcar solo después de comprobar la versión actual.

- [ ] Recorrer Explorar, Mis listas y Mi cuenta; comprobar Atrás/Adelante, idioma y conservación de filtros, ubicación y resultados al navegar.
- [ ] Crear o usar dos cuentas diferentes; probar correo/contraseña, Google y cierre de sesión. Comprobar que al salir se limpian los resultados y datos de la cuenta anterior.
- [ ] Buscar y recomendar con un punto elegido; cambiar filtros y abrir/cerrar el mapa de resultados.
- [ ] En «Ya visité», seleccionar estrellas con ratón y teclado, guardar, recargar, cambiar y quitar la nota. Probar también el guardado sin seleccionar una nota.
- [ ] Abrir las preferencias opcionales de la nota; comprobar que comida y presupuesto guardados influyen en las recomendaciones.
- [ ] Confirmar que la segunda cuenta no ve datos de la primera; borrar búsquedas conserva listas y notas.
- [ ] Abrir una ficha desde Explorar y desde ambas listas; volver con el enlace y con Atrás/Adelante conserva resultados y página. Probar guardar, mover, quitar y valorar desde la ficha. Recargar una ficha muestra una salida para volver a buscar o abrir la lista.
- [ ] Comprobar estrellas de Google y carrusel: flechas, deslizamiento táctil, teclado y un máximo de cinco fotos. Recorrer las fotos no debe repetir peticiones al backend. Probar pocas fotos, imagen fallida, créditos y acceso al original.
- [ ] Abrir fotos y reseñas, cambiar idioma y actualizar detalles. Comprobar los casos sin foto o resumen y los enlaces de atribución.
- [ ] Desplegar y abrir «Compartir esta lista»; generar un enlace desde Vercel, abrirlo en navegación privada, revocarlo y comprobar que ya no permite consultar la lista.
- [ ] Revisar español e inglés, foco de teclado, estrellas y formularios a 320 px y en escritorio, sin desbordamiento horizontal.
- [ ] Repetir un intento sin conexión y confirmar que el error permite reintentar sin perder los datos ya guardados.

Después de copiar los cambios, ejecutar `npm run lint`, `npm test`,
`npm run lint:backend`, `npm run test:backend` y `npm run build`.
La comprobación de Vercel corresponde al despliegue del último commit.
