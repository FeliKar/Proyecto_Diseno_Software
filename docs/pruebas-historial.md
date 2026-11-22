# Pruebas de historial y recomendaciones

Marcar solo después de comprobar cada caso con el backend desplegado.

- [x] Sin historial, solicitar recomendaciones: muestra opciones cercanas y explica que aún no son personalizadas.
- [x] Buscar dos veces comida italiana y una vez mariscos; comprobar que la recomendación use italiana.
- [x] Repetir con presupuestos distintos y comprobar que use el más frecuente; un empate favorece el usado más recientemente.
- [x] Cambiar los filtros del formulario y pedir recomendaciones: usa el historial, conserva el punto elegido y muestra los filtros realmente utilizados.
- [x] Comprobar que pedir recomendaciones no agrega entradas al historial, que se muestran como máximo cinco locales y que un resultado vacío se informa correctamente.
- [x] Recargar y comprobar persistencia; con otra cuenta, verificar recomendaciones independientes.
- [ ] En «Preferencias de recomendaciones», cancelar un borrado y comprobar que las preferencias se conservan. Después confirmar el borrado y solicitar nuevas recomendaciones: deben volver al estado sin historial. Las listas personales se conservan.
- [x] Sin conexión, intentar borrar las preferencias: informa el error sin mostrar un borrado exitoso.
- [x] Comprobar los nuevos textos en español e inglés y uso en pantalla pequeña.
- [x] Ejecutar la prueba SQL de permisos sin errores.

Las pruebas automáticas comprueban además que un fallo al guardar el historial
no elimina resultados válidos y que un fallo al leerlo no se presenta como
si el usuario no tuviera historial.
