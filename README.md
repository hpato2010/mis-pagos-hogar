# Mis Pagos · Hogar

Microapp gratuita para registrar arriendo, gasto común, agua, luz y gas en pesos chilenos.

## Funciones
- Montos y vencimientos configurables por cuenta.
- Resumen mensual: total, pagado, pendiente.
- Historial mensual guardado en almacenamiento local del navegador.
- Marcar y deshacer pagos.
- Recordatorios visuales y notificaciones al abrir la aplicación dentro de los dos días anteriores al vencimiento.
- Exportación de eventos de calendario con alarma dos días antes (para avisos con la app cerrada).
- Respaldo y restauración JSON.

## Publicación
Sitio estático. Importa este repositorio desde Vercel con Framework Preset: Other y sin comando de compilación. El archivo principal es index.html.

## Privacidad y límites
Los datos quedan guardados en el navegador de cada dispositivo, no se sincronizan entre teléfonos. Haz respaldos con regularidad. Las notificaciones del navegador no funcionan en segundo plano cuando la app está cerrada; usa el calendario del móvil para esos avisos. Los montos de ejemplo comienzan en cero.