# IntercalaPDF 📄

**Intercala dos documentos PDF página a página, con la posibilidad de invertir el orden del segundo archivo.** Ideal para reconstruir escaneos a doble cara realizados en dos tandas con una impresora o escáner de una sola cara.

La aplicación funciona **directamente en el navegador**, sin registro, sin backend y sin enviar tus documentos a un servidor.

## ✨ Funcionalidades

- Carga de **dos archivos PDF** mediante selección o arrastrar y soltar.
- Intercalado página a página: primero una del PDF A, después una del PDF B.
- Segundo PDF en **orden normal o inverso** (inverso seleccionado por defecto).
- **Vista previa del orden** de las páginas y contador total.
- Compatibilidad con documentos que tienen **distinto número de páginas**.
- Descarga inmediata del PDF resultante.
- Interfaz responsive para escritorio y móvil.
- Procesamiento local mediante JavaScript, sin almacenar los documentos en un servidor.

## 🔄 ¿Cómo funciona?

Por ejemplo, al escanear un documento de ocho páginas por las dos caras:

| PDF A: caras delanteras | PDF B: caras traseras, escaneadas desde el final |
| ----------------------- | ------------------------------------------------ |
| 1, 3, 5, 7              | 8, 6, 4, 2                                       |

Al seleccionar **orden inverso** para el PDF B, el resultado será:

```text
PDF A:  1    3    5    7
PDF B:    2    4    6    8
        ↓ ↓  ↓ ↓  ↓ ↓  ↓ ↓
Final:  1 2  3 4  5 6  7 8
```

Si seleccionas **orden normal**, se respetará el orden original del segundo archivo: `1, 8, 3, 6, 5, 4, 7, 2`.

## 🚀 Uso en local

No necesitas instalar Python, Node.js ni dependencias.

1. Descarga este repositorio (opción **Code → Download ZIP**) o clónalo:

   ```bash
   git clone URL_DE_TU_REPOSITORIO
   ```

2. Abre `index.html` en un navegador moderno (Chrome, Edge o Firefox).
3. Selecciona el **primer PDF** y el **segundo PDF**.
4. Marca **Orden normal** u **Orden inverso** para el segundo archivo.
5. Pulsa **Intercalar y generar PDF**.
6. Descarga `documento_intercalado.pdf`.

> **Conexión:** se necesita Internet al cargar la aplicación para obtener `pdf-lib` desde jsDelivr, salvo que el recurso ya esté disponible en la caché del navegador. Los archivos PDF **no se envían** al CDN.

### Estructura del proyecto

```text
IntercalaPDF/
├── index.html     # Interfaz de usuario
├── styles.css     # Estilos y diseño responsive
├── app.js         # Lectura, ordenación e intercalado de PDF
└── README.md      # Documentación
```

## 🧰 Tecnologías

- **HTML5**: estructura y formularios.
- **CSS3**: diseño adaptable y estados visuales.
- **JavaScript (Vanilla JS)**: gestión de archivos e interacción.
- **[pdf-lib 1.17.1](https://pdf-lib.js.org/)**: lectura, copia y generación de páginas PDF en el navegador.

No utiliza frameworks ni herramientas de compilación.

## 🔒 Privacidad y limitaciones

- Los PDF se procesan en la memoria del dispositivo: **no existe una API de subida ni almacenamiento de documentos en servidor**.
- La biblioteca JavaScript se obtiene desde un CDN; esa solicitud de recurso sí requiere conexión de red.
- No se admiten PDF protegidos con contraseña.
- Los archivos grandes pueden consumir bastante memoria y reducir el rendimiento, especialmente en móviles.
- Se modifica el **orden de las páginas**, pero no su orientación: las páginas giradas seguirán giradas.
- Algunos elementos avanzados de PDF, como formularios interactivos o marcadores, podrían no conservarse íntegramente al copiar las páginas.
- La vista previa representa el **orden de las páginas**, no una miniatura visual del contenido.

## 🛣️ Posibles mejoras

- Miniaturas reales de las páginas.
- Rotación y reordenación manual.
- Selección o eliminación de páginas concretas.
- Versión completamente offline, con la biblioteca incluida en el repositorio.

---

**IntercalaPDF** · Una herramienta sencilla para poner en orden tus escaneos a doble cara.
