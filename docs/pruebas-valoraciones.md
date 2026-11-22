# Pruebas de valoraciones personales

Marcar después de comprobar con las funciones desplegadas.

- [ ] En «Ya visité», guardar una nota de 1 a 5, tipo de comida y presupuesto. Recargar la lista y comprobar persistencia.
- [ ] Cambiar la nota y quitarla. La entrada sigue en la lista y los campos se actualizan al recargar.
- [ ] Con otra cuenta, comprobar que no aparecen las notas de la primera, incluso si ambas guardan el mismo restaurante.
- [ ] En «Quiero visitar» no aparece el formulario. Mover allí un local calificado: la nota se conserva, pero deja de intervenir en las recomendaciones. Al devolverlo a «Ya visité», vuelve a intervenir.
- [ ] Borrar el historial de búsquedas. Calificar un único local visitado con 5, categoría italiana y presupuesto económico. Pedir recomendaciones: muestra esos filtros, aunque no haya historial. Puede no haber resultados dentro del radio.
- [ ] Cambiar esa nota a 1 y pedir recomendaciones sin historial: no debe elegir esa categoría ni presupuesto como preferencia positiva. Una nota 3 es neutral.
- [ ] Combinar una búsqueda de mariscos con una valoración italiana de 5: la recomendación debe elegir italiana. Quitar esa valoración y volver a pedir recomendaciones: debe usar mariscos.
- [ ] Sin conexión, intentar guardar o quitar una valoración: aparece un error y al recargar con conexión se conserva el último valor guardado.
- [ ] Revisar español, inglés y pantalla pequeña. La nota personal se distingue de las estrellas de Google.
- [ ] Ejecutar `supabase/personal-ratings.test.sql` sin errores.

Las pruebas automáticas también rechazan notas fuera de rango, bloquean
actualizaciones de entradas inexistentes o ajenas y comprueban que las notas
se conservan en la respuesta cuando faltan los datos de Google.
