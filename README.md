# 🚀 Extensión de Chrome - Guía de Instalación Local

Este repositorio contiene el código fuente de mi extensión. Para probarla en tu navegador mientras desarrollas, sigue estos pasos:

## 📥 Cómo instalar en el navegador

Sigue estos pasos para cargar la extensión en **Google Chrome**:

1. Abre tu navegador y dirígete a la siguiente dirección:
   > **`chrome://extensions/`**
2. En la esquina superior derecha, activa el interruptor que dice **"Modo de desarrollador"** (Developer mode).
3. Aparecerá una barra de herramientas nueva. Haz clic en el botón:
   > **"Cargar extensión sin empaquetar"** (Load unpacked).
4. Se abrirá un explorador de archivos. Selecciona la carpeta del proyecto.
   * *Nota: Al tratarse de momento de una extensión sencilla de JS puro, selecciona la carpeta raíz donde esté el `manifest.json`.*
5. La extensión aparecerá en tu lista y ya puedes fijarla en tu barra de herramientas.

---

## 🔄 Cómo aplicar cambios

Cada vez que se realizan cambios en el código:

* Guardar los cambios.
* Ir a `chrome://extensions/` y hacer clic en el **icono de flecha circular (Actualizar)** que aparece en la tarjeta de tu extensión.
