# Pruebas de autenticación

## Alcance

Se permite crear una cuenta con correo y contraseña, iniciar sesión con
contraseña o Google y cerrar sesión. No se verifica la propiedad del correo
ni se ofrece recuperación de contraseña.

## Pruebas automáticas

Se comprobaron el código, las traducciones, el manejo de errores y la
compilación con:

```bash
npm run lint
npm test
npm run build
npm run lint:backend
npm run test:backend
```

Estas comprobaciones pasaron. Las pruebas automáticas no sustituyen las
pruebas con Supabase y Google reales.

## Ya comprobado

En localhost, después de simplificar el registro:

- Crear una cuenta sin confirmación de correo.
- Conservar la sesión al recargar, cerrarla y volver a entrar con contraseña.
- Mostrar un error al intentar registrar el mismo correo.
- Iniciar sesión con Google.
- No mostrar recuperación de contraseña en español ni inglés.

En la web publicada, antes de simplificar el registro:

- Iniciar sesión con Google, conservar la sesión y cerrarla.
- Exigir sesión para buscar restaurantes.
- Mostrar hasta cinco resultados o un mensaje si no hay coincidencias.
- Conservar la ubicación al cambiar filtros y mostrar la búsqueda en inglés.
- Pedir autenticación al buscar después de cerrar sesión.

## Comprobado en la web publicada

- [x] Crear una cuenta sin confirmación, recargar, cerrar sesión, recargar
  y volver a entrar con contraseña. La sesión debe conservarse hasta cerrarla.
- [x] Rechazar correo inválido, contraseña de registro menor a ocho caracteres
  y contraseñas de confirmación diferentes.
- [x] Mostrar errores por contraseña incorrecta y registro duplicado,
  permitiendo volver a intentar.
- [x] Cancelar el acceso con Google y poder volver a intentarlo.
- [x] Intentar iniciar sesión sin conexión, comprobar el error y reintentar
  al recuperar la conexión.
- [x] Revisar formularios y mensajes propios de la aplicación en ambos idiomas,
  sin opciones de recuperación de contraseña.
- [x] Usar los formularios con teclado, comprobar el foco visible y revisar
  que no se desborden en una pantalla de 320 px.
