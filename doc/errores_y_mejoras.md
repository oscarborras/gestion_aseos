# Errores (Bugs)
- [ ] 
- [ ] 

# Mejoras
- [ ] Añadir pantalla para ver turnos anulados. Visible solo para admin?
- [ ] Añadir modo oscuro
- [ ] Exportar datos a Excel

# Nuevas funcionalidades
- [ ] En ajustes, añadir botón para borrar todos los datos para empezar curso nuevo.
- [ ] 


# Publicacion en servidor local
1. Preparar el Servidor de Supabase
Como el servidor web estará en otra máquina, Supabase debe aceptar conexiones externas (de tu red local).

En la máquina donde corre Supabase, averigua su IP local (ej. 192.168.1.50).
Asegúrate de que el firewall de esa máquina permita conexiones a los puertos de Supabase (por defecto 8000 para la API y 5432 para Postgres).
Importante: En tu archivo .env.local de la máquina del servidor web, no puedes usar 127.0.0.1. Debes usar la IP real:
env
NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.50:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

2. Preparar el Servidor Web (Tu máquina propia)
En la máquina donde quieres que corra la web:

Instalar Node.js (versión 18 o superior).
Clonar el proyecto desde GitHub o copiar la carpeta.
Instalar dependencias:
bash
npm install

Construir la versión de producción:
bash
npm run build
Esto generará una carpeta .next optimizada para velocidad y rendimiento.

3. Ejecutar en Producción
Para que la aplicación esté siempre encendida y se reinicie sola si hay un fallo, te recomiendo usar PM2:

Instala PM2 globalmente: npm install -g pm2
Lanza la aplicación:

bash
pm2 start npm --name "gestion-aseos" -- start
Configura PM2 para que arranque con el sistema:

bash
pm2 startup
pm2 save

4. Acceso desde la Red
Ahora, cualquier dispositivo de tu red (móviles de profesores, ordenanzas, tablets) podrá acceder entrando a la IP del servidor web. Ej: http://192.168.1.100:3000.

Un paso extra recomendado: Proxy Inverso con Nginx
Si no quieres que los usuarios tengan que escribir :3000 al final de la URL, puedes instalar Nginx en la máquina web para que redirija el tráfico del puerto 80 al 3000. Así solo escribirían la IP o el nombre del servidor (ej: http://aseos-ies/).

¿Quieres que te prepare una guía rápida de cómo configurar Nginx para que la URL sea más profesional en tu red local?