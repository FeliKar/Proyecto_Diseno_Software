# Pruebas de listas compartidas

Marcar después de comprobar con las funciones desplegadas.

- [x] Abrir una lista propia y generar el enlace. Volver a generarlo: debe conservar el mismo enlace mientras siga activo.
- [x] Abrir el enlace en una ventana privada sin iniciar sesión y pulsar «Ver lista». Muestra únicamente el tipo de lista y sus restaurantes, sin notas personales, correo ni controles de edición.
- [x] Compartir «Ya visité» y «Quiero visitar»: sus enlaces y contenidos son independientes. La otra cuenta conserva sus propias listas.
- [x] Con seis restaurantes, comprobar páginas de hasta cinco y navegación anterior/siguiente.
- [x] Agregar o quitar un restaurante en la cuenta propietaria y actualizar la vista compartida: refleja el contenido actual. Comprobar también una lista vacía.
- [x] Dejar de compartir. Abrir el enlace anterior o actualizarlo: informa que no está disponible. Generar un nuevo enlace: funciona y es diferente; el anterior sigue sin funcionar.
- [x] Copiar el enlace con el botón; si falla el portapapeles, comprobar que puede seleccionarse y copiarse manualmente.
- [x] Probar un enlace con un identificador inválido y una solicitud sin conexión: aparecen mensajes apropiados.
- [x] Comprobar español, inglés y pantalla pequeña. Los enlaces de restaurantes abren Google Maps.
- [x] Ejecutar `supabase/shared-lists.test.sql` sin errores.

Las pruebas automáticas comprueban que no se aceptan propietarios desde el
navegador, no se exponen campos privados y no se llama a Google con enlaces
revocados ni cuando falla o se agota la cuota.
