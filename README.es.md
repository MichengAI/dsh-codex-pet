<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**Un pequeño compañero para tus tareas en DeepSeek Harness**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Registro de cambios](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Licencia: Apache-2.0](https://img.shields.io/badge/Licencia-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![npm descargas](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20descargas)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet es un plugin de mascotas mantenido por la comunidad para DeepSeek Harness (DSH), no un producto oficial de OpenAI o DeepSeek AI. A partir de la versión 1.0.1, es compatible con DSH `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5`, `0.2.2-rc.1` `0.2.2-rc.2`, y `0.2.2-rc.3`. Las versiones anteriores y las alfas de `0.2.1` son rechazadas por la comprobación de versiones, por lo que el plugin no se ejecutará; las configuraciones locales y las mascotas personalizadas no se eliminarán por ello.

## Características

Ten un compañero cerca mientras trabajas en DSH, sigue el progreso de las tareas y gestiona las solicitudes que requieran tu atención. Elige una de las 9 mascotas integradas o crea la tuya mediante un Skill.

- **9 mascotas integradas**: selecciona un compañero y ajusta su tamaño en los ajustes de mascotas. Los recursos gráficos vienen empaquetados localmente.
- **Compañero en la página**: acompáñate en DSH Web. Las mascotas flotantes de escritorio requieren una aplicación de escritorio compatible con esta función.
- **Múltiples tareas de un vistazo**: supervisa tareas en ejecución, finalizadas, errores y solicitudes pendientes. Cuando no hay notificaciones, solo la mascota permanece visible.
- **Actúa desde la notificación**: abre la tarea asociada, detén el turno actual o responde a solicitudes admitidas de aprobación, preguntas o planes.
- **Silencio cuando lo necesites**: descarta recordatorios individuales sin detener la tarea; oculta o restaura la mascota desde su menú o ajustes.
- **Crea tu propio compañero**: describe una mascota en los ajustes e inicia una tarea dedicada en DSH mediante el Skill `hatch-pet` incluido.
- **Pequeñas interacciones**: arrastra para moverla, doble clic para hacerla saltar y clic derecho para abrir su menú.

## Capturas de pantalla

### Notificaciones de múltiples tareas

Observa las tareas en ejecución junto a tu mascota, con controles independientes para abrir la conversación, detener el turno actual o descartar el recordatorio.

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="Una mascota con dos notificaciones de tareas en ejecución" width="403">
</p>

### Ajustes de mascota

Elige entre las 9 mascotas integradas, accede al directorio de mascotas personalizadas y ajusta el tamaño.

![Biblioteca de mascotas y ajustes de apariencia](assets/screenshots/pet-settings.png)

### Un compañero en tu conversación

Sigue trabajando en DSH mientras la mascota y las notificaciones permanecen discretamente en la esquina de la pantalla.

![Mascota y notificaciones junto a una conversación de DSH](assets/screenshots/pet-conversation.png)

## Ecosistema de productos DSH

Para un entorno de trabajo de escritorio completo, descarga [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Las instalaciones existentes de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) pueden agregar plugins según sus necesidades:

| Plugin | Qué puedes hacer |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organizar proyectos y conversaciones, buscar tareas y navegar por los turnos de chat |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Seleccionar e invocar especialistas para tu tarea |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Buscar, activar, crear e importar habilidades locales |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Buscar, restaurar o limpiar conversaciones archivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Enviar tareas y recibir respuestas mediante plataformas de mensajería |
| [Automation](https://github.com/MichengAI/dsh-automation) | Programar tareas automáticas y revisar los registros de ejecución |
| [BTW](https://github.com/MichengAI/dsh-btw) | Hacer preguntas secundarias sin interrumpir la tarea principal |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Usar `/simplify` para mejorar el código dentro de tus cambios de Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Guiar al agente para buscar nuevas alternativas tras fallos, investigar causas y verificar antes de concluir |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Usar `/review` para solicitar una revisión de código independiente |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Ver notificaciones de tareas y responder a aprobaciones de herramientas desde el escritorio |

## Instalación

Versiones de DeepSeek Harness compatibles: **`0.2.0-rc.1`**, **`0.2.0-rc.2`**, **`0.2.1-rc.1`–`0.2.1-rc.5`**, **`0.2.2-rc.1`** y **`0.2.2-rc.2`, `0.2.2-rc.3`**. Asegúrate de tener disponible el comando `dsh`. El siguiente ejemplo utiliza el perfil `web`; cámbialo por tu perfil de destino si es necesario.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Reinicia DSH después de la instalación y abre **Ajustes → Mascotas** (o **Settings → Pets**).

## Uso

Abre **Ajustes → Mascotas**, o abre los ajustes desde el menú contextual con clic derecho sobre la mascota.

| Objetivo | Acción |
| --- | --- |
| Elegir compañero | Selecciona una mascota en los ajustes y ajusta su tamaño. |
| Mover o jugar | Arrastra la mascota para moverla; doble clic para que salte. |
| Leer novedades de tareas | Observa las burbujas de notificación; despliega la lista si hay varias tareas. |
| Continuar conversación | Haz clic en la notificación para abrir la tarea correspondiente de DSH. |
| Atender solicitud | Abre los detalles y responde a la aprobación, pregunta o plan. |
| Detener un turno | Haz clic en el botón de detención de la notificación correspondiente. |
| Descartar aviso | Haz clic en el botón de cerrar. La tarea continuará ejecutándose. |
| Ocultar o restaurar | Usa el menú de clic derecho o los ajustes de mascotas. |

### Crear una mascota personalizada

1. Abre los ajustes de mascotas, haz clic en el icono **+** (`Crear`) y describe tu compañero.
2. Haz clic en **Crear en DSH**. El plugin abrirá una tarea dedicada y enviará las instrucciones del Skill.
3. Sigue el progreso de la tarea (se requiere una herramienta de generación de imágenes configurada en DSH).
4. Cuando los archivos de la mascota se hayan guardado, actualiza la biblioteca y selecciónala.

## Actualización y desinstalación

Para actualizar, usa el gestor de plugins de DSH o ejecuta:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Para desinstalar:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

Las mascotas personalizadas se guardan por defecto en `.dsh/codex-pet/pets` dentro de tu directorio de usuario. Al desinstalar el plugin, estos archivos y configuraciones se conservan intactos.

## Contribuir

Consulta la [guía de desarrollo y validación (en chino)](https://github.com/MichengAI/dsh-codex-pet/blob/main/CONTRIBUTING.md) para conocer los procedimientos locales de desarrollo, pruebas y publicación. Tanto GitHub como npm incluyen una carpeta `lib` lista para ejecutar; tras modificar el código fuente, ejecuta `npm run build` antes de confirmar tus cambios.

## Licencia

El código fuente original de este plugin está licenciado bajo [Apache License 2.0](LICENSE). Los gráficos y animaciones pixel-art de las mascotas proceden de OpenAI Codex y están excluidos de la concesión de licencia Apache-2.0 de este proyecto; consulta [NOTICE](NOTICE) para más detalles.
