# Visor 3D geoespacial con Three.js

Este proyecto implementa un visor 3D geoespacial desarrollado con **Three.js** y **TypeScript**, orientado a la carga e inspección de modelos **OBJ** en un entorno web.

La aplicación carga dos modelos suministrados, los representa en una escena 3D y permite:

- mostrar u ocultar cada modelo de forma independiente,
- inspeccionar su geometría con iluminación adecuada,
- visualizar referencias espaciales mínimas,
- introducir manualmente coordenadas **X, Y, Z**,
- crear un marcador visual en esa posición para validar su coherencia respecto a los modelos.

---

## Funcionalidades principales

- Carga de dos archivos OBJ:
  - `N720.obj`
  - `RSE.obj`
- Representación simultánea de ambos modelos en la escena
- Activación/desactivación independiente de cada modelo
- Referencias visuales para orientación espacial:
  - ejes globales
  - rejilla
  - cajas de contorno por modelo
- Controles de cámara para:
  - encuadrar toda la escena
  - encuadrar cada modelo por separado
- Formulario para introducir coordenadas `X, Y, Z`
- Creación de un marcador visual en la posición indicada
- Valores por defecto en el formulario con una coordenada válida calculada a partir del centro del conjunto cargado
- Pruebas unitarias básicas sobre lógica espacial y normalización de datos

---

## Tecnologías utilizadas

- **TypeScript**
- **Vite**
- **Three.js**
- `OBJLoader`
- `OrbitControls`
- **Vitest**

---

## Requisitos previos

Para ejecutar el proyecto en local es necesario tener instalado:

- **Node.js** 18 o superior
- **npm**

Puedes comprobarlo con:

```bash
node -v
npm -v