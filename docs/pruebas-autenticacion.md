# Pruebas de autenticación

## Comprobaciones automáticas

`npm test` comprueba que ambos idiomas cubran las mismas claves
y que los errores conocidos/desconocidos se conviertan en mensajes
traducidos sin mostrar detalles internos.

`npm run lint` y `npm run build` revisan el código y la compilación.

Estas pruebas no verifican el proveedor remoto ni sustituyen
la revisión del navegador.

## Pruebas manuales con el proyecto real

Marcar cada casilla solo después de ejecutar el caso.
Registrar fecha y resultado debajo si aparece un problema.
Usar cuentas propias de prueba y nunca guardar contraseñas
ni tokens aquí.

- [ ] Sin `.env.local`: la página muestra el aviso y permite buscar/filtrar restaurantes.
- [ ] Con configuración válida: aparece el formulario y termina el estado de carga.
- [ ] Correo inválido o contraseña nueva menor a 8 caracteres: el formulario impide el envío.
- [ ] Contraseñas diferentes: aparece un mensaje y no se registra el usuario.
- [ ] Registro: llega el correo; el enlace confirma la cuenta y regresa a la web.
- [ ] Registro duplicado: la interfaz no promete crear una segunda cuenta.
- [ ] Correo sin confirmar: no permite entrar y muestra el mensaje correspondiente.
- [ ] Contraseña incorrecta: aparece un error y permite volver a intentar.
- [ ] Inicio correcto: muestra el correo del usuario; recargar conserva la sesión.
- [ ] Cerrar sesión: vuelve al formulario; recargar no restaura la sesión cerrada.
- [ ] Google: autentica con una cuenta de prueba y regresa a la aplicación.
- [ ] Cancelar Google: al regresar muestra un error comprensible y permite reintentar.
- [ ] Recuperación: el enlace abre el formulario de nueva contraseña; guardarla funciona y permite entrar con ella tras cerrar sesión.
- [ ] Enlace de recuperación vencido/usado: no permite actualizar y ofrece solicitar otro.
- [ ] Fallo de red: termina el estado de espera con un mensaje y permite reintentar.
- [ ] Cuota de correos agotada: se informa del problema y no se afirma que el correo fue enviado.
- [ ] Todos los formularios, estados y errores cambian entre español e inglés.
- [ ] Teclado: etiquetas, foco visible y botones utilizables sin ratón.
- [ ] Pantalla de 320 px: formularios sin desbordamiento horizontal.
- [ ] Buscar, combinar filtros, limpiar y desplegar detalles siguen funcionando.

## Resultado de la preparación

En la copia de preparación pasaron lint, las dos pruebas automáticas
y build. Los casos manuales de esta lista quedan pendientes
de configurar Supabase, Google y correo.
No se han probado cuentas reales.