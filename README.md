# Casa Walkthrough

Visor 3D estatico con recorrido interactivo y camara cinematografica.

## Publicacion en Render

Subir solamente esta carpeta a un repositorio nuevo, preferentemente privado.
En Render, conectar ese repositorio mediante New > Blueprint para aplicar
`render.yaml`. Alternativamente, crear un Static Site con estos valores:

- Build Command: `node build.mjs`
- Publish Directory: `dist`
- Root Directory: vacio

No requiere base de datos ni servidor de pago. Las condiciones y limites de
trafico del servicio siguen siendo los de la cuenta de Render.

## Privacidad

Contiene solo la escena reconstruida, bibliotecas, recursos visuales con licencia
y cuadros generados. No incluye documentos originales, fotografias personales,
enlaces privados ni funciones de descarga de los documentos.
La distribucion y geometria de la casa son visibles en el recorrido.
Los avisos `noindex` no son controles de acceso: quien tenga el enlace publico
puede abrir el visor y descargar los recursos necesarios para mostrarlo.

El build comprueba cada archivo contra el manifiesto revisado. No agregar
archivos ajenos a la publicacion ni subir la carpeta de trabajo completa.
