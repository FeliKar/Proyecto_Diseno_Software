# Pruebas de listas personales

Usar dos cuentas propias. Marcar solo después de comprobar cada caso.

- [x] Guardar un resultado en «Quiero visitar», abrir la lista y comprobar su nombre.
- [x] Guardarlo de nuevo y comprobar que no aparece duplicado.
- [x] Recargar la página y comprobar que la entrada sigue guardada.
- [x] Moverlo a «Ya visité» y comprobar que deja de estar en la primera lista.
- [x] Quitar una entrada y comprobar que no reaparece después de recargar.
- [x] Cambiar de cuenta y comprobar que sus listas son independientes.
- [x] Cerrar sesión y comprobar que las listas dejan de mostrarse.
- [x] Guardar seis locales y comprobar la navegación entre páginas.
- [x] Comprobar los mensajes de lista vacía y ambos idiomas.
- [x] Sin conexión, intentar mover o quitar una entrada: debe mostrar un error y conservarla.
- [x] Ejecutar la prueba SQL de permisos y confirmar que termina sin errores.

Las pruebas automáticas también simulan un fallo de Google: la entrada
permanece disponible aunque no se puedan mostrar su nombre y dirección.
