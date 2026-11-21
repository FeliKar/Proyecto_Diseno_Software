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
- [x] Con configuración válida: aparece el formulario y termina el estado de carga.
- [ ] Correo inválido o contraseña nueva menor a 8 caracteres: el formulario impide el envío.
- [ ] Contraseñas diferentes: aparece un mensaje y no se registra el usuario.
- [ ] Registro nuevo sin verificación: crea la cuenta e inicia sesión sin enviar un correo.
- [ ] Registro duplicado: la interfaz no promete crear una segunda cuenta.
- [ ] Contraseña incorrecta: aparece un error y permite volver a intentar.
- [x] Inicio correcto: muestra el correo del usuario; recargar conserva la sesión.
- [x] Cerrar sesión: vuelve al formulario; recargar no restaura la sesión cerrada.
- [x] Google: autentica con una cuenta de prueba y regresa a la aplicación.
- [ ] Cancelar Google: al regresar muestra un error comprensible y permite reintentar.
- [ ] Fallo de red: termina el estado de espera con un mensaje y permite reintentar.
- [ ] Todos los formularios, estados y errores cambian entre español e inglés.
- [ ] Teclado: etiquetas, foco visible y botones utilizables sin ratón.
- [ ] Pantalla de 320 px: formularios sin desbordamiento horizontal.
- [ ] Buscar, combinar filtros, limpiar y desplegar detalles siguen funcionando.


## Resultados de las pruebas

Las comprobaciones automáticas de lint, pruebas y compilación pasaron.

En la versión anterior se comprobó el registro con confirmación de correo, el inicio con correo y contraseña y el acceso con Google en localhost:5173. También se verificó la persistencia de la sesión al recargar y el cierre de sesión.


### Pruebas en producción — 18/11/2026

Dirección: https://proyectodisenosoftware.vercel.app

- [x] Iniciar sesión con Google y regresar a la aplicación.
- [x] Recargar la página y conservar la sesión.
- [x] Cerrar sesión y permanecer desconectado después de recargar.

Quedan pendientes los casos sin marcar y la validación del registro sin confirmación e inicio con contraseña en producción. Las pruebas históricas no validan el nuevo registro.

### Búsqueda real en producción — 21/11/2026

- [x] Sin sesión: la búsqueda solicita autenticación.
- [x] Con Google: buscar en un punto del mapa devuelve hasta cinco restaurantes o informa que no hay resultados.
- [x] Los filtros de comida y precio conservan las coordenadas.
- [x] Los textos y mensajes de búsqueda cambian a inglés.
- [x] Tras cerrar sesión, una nueva búsqueda solicita autenticación.

### Alcance simplificado — validado en localhost

No se ofrece recuperación de contraseña ni se verifica la propiedad del correo.

- [x] Registrar una cuenta nueva con un correo propio externo al equipo de Supabase.
- [x] Recargar y conservar la sesión de esa cuenta.
- [x] Cerrar sesión y volver a entrar con su contraseña.
- [x] Intentar registrar el mismo correo y comprobar que se informa del error.
- [x] Comprobar que no aparece recuperación de contraseña en español ni inglés.
