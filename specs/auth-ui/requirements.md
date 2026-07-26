# auth-ui — Requirements

> Feature #3 — UI de login, registro y social auth (Google/GitHub)
> EARS estricto. Cada R\<n\> es verificable por al menos un test.

---

## R1

El sistema DEBE configurar Google como provider social en better-auth,
leyendo `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` desde variables de
entorno.

## R2

El sistema DEBE configurar GitHub como provider social en better-auth,
leyendo `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` desde variables de
entorno.

## R3

La página `/login` DEBE presentar un formulario con campos email y
password.

## R4

CUANDO el formulario de login es enviado, el sistema DEBE invocar
`authClient.signIn.emailAndPassword` con email y password.

## R5

CUANDO el login con email/password es exitoso, el sistema DEBE
redirigir al usuario a `/`.

## R6

SI las credenciales de login son incorrectas ENTONCES el sistema DEBE
mostrar un mensaje de error visible sin redirigir. Los errores de
validación de formulario (email inválido, password vacío) DEBEN ser
capturados por el schema Zod `loginSchema` y mostrar el mensaje del
schema.

## R7

La página `/login` DEBE presentar botones para iniciar sesión con
Google y GitHub mediante `authClient.signIn.social`.

## R8

SI el login con provider social falla ENTONCES el sistema DEBE mostrar
un mensaje de error visible.

## R9

La página `/signup` DEBE existir y ser accesible en la ruta `/signup`.

## R10

La página `/signup` DEBE presentar un formulario con campos name,
email, password y password confirmation.

## R11

SI la password y la confirmación no coinciden ENTONCES el sistema DEBE
mostrar un mensaje de error visible sin enviar el formulario. La
validación DEBE usar el schema Zod `signupSchema` (refine de
coincidencia). Los errores de validación (email inválido, password < 8
chars, name vacío) TAMBIÉN DEBEN ser capturados por `signupSchema` y
mostrar los mensajes del schema.

## R12

CUANDO el formulario de registro es enviado con datos válidos, el
sistema DEBE invocar `authClient.signUp.emailAndPassword` con name,
email y password.

## R13

CUANDO el registro es exitoso, el sistema DEBE redirigir al usuario a
`/`.

## R14

SI el email ya está registrado ENTONCES el sistema DEBE mostrar un
mensaje de error visible.

## R15

La página `/signup` DEBE presentar botones para iniciar sesión con
Google y GitHub mediante `authClient.signIn.social`.

## R16

CUANDO un usuario autenticado accede a `/signup`, el middleware DEBE
redirigirlo a `/`.

## R17

CUANDO un usuario autenticado accede a `/login`, el middleware DEBE
redirigirlo a `/`.
