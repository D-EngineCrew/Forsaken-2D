# FORSAKEN 2D — v0.7.0 (Android nativo)

Esta versión inicia la reconstrucción del proyecto sobre **Android nativo con Kotlin**, usando una Activity y un renderizador Canvas de Android. Ya no se utiliza `index.html`, Vite ni Capacitor para compilar la aplicación.

> Proyecto fan independiente, no afiliado a Roblox ni a los creadores de Forsaken. Los recursos visuales incluidos son provisionales/originales. Utiliza únicamente recursos propios o que tengas permiso para distribuir.

## Novedades v0.7.0

- Migración inicial a un proyecto Android nativo (Kotlin + Android Gradle Plugin).
- Eliminación de `index.html`, Vite y Capacitor del cliente Android.
- Pantalla de presentación `splash.png` incluida en `android-native/splash.png` y configurada como fondo de inicio de Android.
- Icono de aplicación F roja sobre fondo negro en las cinco densidades Android: mdpi, hdpi, xhdpi, xxhdpi y xxxhdpi.
- `AndroidManifest.xml` configura los iconos, el nombre de la app y orientación `unspecified`, para respetar la rotación del sistema.
- Menú nativo inicial y arena Canvas de prueba con movimiento táctil básico.
- GitHub Actions compila directamente el APK nativo usando Java 17 y Gradle; no necesita Node.js.

## Estructura

- `android-native/`: proyecto Android nativo completo.
- `android-native/app/src/main/java/com/forsaken2d/game/MainActivity.kt`: Activity y base Canvas inicial.
- `android-native/app/src/main/res/drawable/splash.png`: imagen de presentación.
- `android-native/app/src/main/res/mipmap-*/ic_launcher.png`: iconos Android por densidad.
- `splash.png`: copia fuente de la pantalla de presentación.
- `assets/icons/`: copias de los iconos por densidad para edición.
- `server/`: código de servidor experimental conservado como referencia; no está desplegado ni conectado al cliente nativo de esta versión.

## Compilar APK desde GitHub

1. Sube el contenido del ZIP a tu repositorio GitHub.
2. Abre la pestaña **Actions**.
3. Ejecuta **FORSAKEN 2D - Native Android APK** o haz push a `main`/`master`.
4. Al terminar, descarga el artifact `FORSAKEN-2D-v0.7.0-Android-APK`.

El workflow usa Temurin JDK 17 y Gradle para ejecutar `assembleDebug` dentro de `android-native/`.

## Compilar localmente

Necesitas Android SDK, Java JDK 17 y Gradle compatible con Android Gradle Plugin 8.7.3.

```bash
cd android-native
gradle assembleDebug
```

APK de depuración: `android-native/app/build/outputs/apk/debug/app-debug.apk`.

## Estado real de esta versión

La v0.7.0 es una **base nativa inicial**, no una conversión completa de las mecánicas del prototipo web anterior. Incluye el arranque, menú inicial y una arena de prueba con movimiento táctil. Los sistemas de partidas, bots, mapas completos, habilidades, tienda, progreso y multijugador todavía deben reconstruirse e integrarse en Kotlin en versiones posteriores. El servidor conservado es experimental y no está desplegado.

## Configuración Android

- `applicationId`: `com.forsaken2d.game`
- `versionName`: `0.7.0`
- `minSdk`: 23
- `targetSdk`: 35
- Orientación: `unspecified` (Android decide según el ajuste de rotación del dispositivo).
