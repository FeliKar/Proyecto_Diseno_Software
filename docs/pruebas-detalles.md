# Pruebas de fotos y reseñas

Marcar después de comprobar con la función desplegada.

- [x] Iniciar sesión, buscar restaurantes y abrir «Ver fotos y reseñas». Comprobar también desde una lista personal.
- [x] Si hay foto, comprobar imagen, autores disponibles y enlace de origen. Probar «Otra foto» cuando aparezca. La imagen puede mostrar comida o el local.
- [x] Comprobar calificación global y cantidad de opiniones. Las notas personales siguen siendo independientes.
- [x] Comprobar las reseñas disponibles: hasta cinco, con nota, comentario, autor y enlace a Google Maps. El recuento de la muestra debe coincidir con las notas mostradas.
- [x] Si Google entrega resumen, comprobar texto, divulgación de Gemini y enlaces de información, reseñas y reporte. Si no lo entrega, aparece el mensaje correspondiente.
- [x] Cambiar de idioma y actualizar los detalles. Comprobar los textos de interfaz y, si Google traduce una reseña, la opción de ver el original.
- [x] Cerrar y volver a abrir los detalles. La búsqueda, los filtros, las listas y sus notas continúan funcionando.
- [x] Sin conexión, intentar abrir detalles: aparece un error. Al recuperar la conexión se puede reintentar.
- [x] Comprobar pantalla pequeña y enlaces de listas compartidas: estos últimos continúan siendo de solo lectura.

Las pruebas automáticas cubren datos ausentes, enlaces inseguros, imágenes
fallidas, notas inválidas, permisos, cuota y ausencia de claves privadas en
la respuesta. La disponibilidad real de fotos, reseñas y resumen depende de
Google; las pruebas simuladas cubren los casos que no se encuentren en los
locales consultados.
