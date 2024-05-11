# SISTEMA OPERATIVO - Ubuntu Server 22.04.4
# NETPLAN CONFIG
# NETPLAN CONFIG
```bash
black@USVR:~$ sudo netplan generate
black@USVR:~$ cd /etc/netplan/
black@USVR:/etc/netplan$ sudo nano 00-installer-config.yaml

network:
  version: 2
  ethernets:
    eth0:  # NOMBRE DE LA INTERFAZ ETHERNET
      dhcp4: no  # DESHABILITAR DHCP PARA IPv4
      addresses: # DIRECCIONES IP ESTÁTICAS ASIGNADAS A eth0
        - 10.0.0.20/24
        - 192.168.15.20/24
      gateway4: 10.0.0.1  # PUERTA DE ENLACE IPv4 POR DEFECTO
      nameservers: # CONFIGURACIÓN DE SERVIDORES DNS
        addresses:  # DIRECCIONES IP DE SERVIDORES DNS
          - 1.1.1.1  # DNS de Google
          - 10.0.0.1 # Servidor DNS local
```
---
# INSTALACIÓN DE DOCKER ENGINE
ACTUALIZAR EL ÍNDICE DE PAQUETES
```bash
sudo apt-get update
```
INSTALAR HERRAMIENTAS NECESARIAS
```bash
sudo apt-get install ca-certificates curl
```
CREAR EL DIRECTORIO PARA LAS CLAVES GPG
```bash
sudo install -m 0755 -d /etc/apt/keyrings
```
DESCARGAR LA CLAVE GPG OFICIAL DE DOCKER
```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```
ESTABLECER PERMISOS PARA LA CLAVE
```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```
AGREGAR EL REPOSITORIO DE DOCKER AL SISTEMA
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```
ACTUALIZAR EL ÍNDICE DE PAQUETES NUEVAMENTE
```bash
sudo apt-get update
```
INSTALAR LOS PAQUETES DE DOCKER
```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin
```
---
# INSTALACIÓN DE DOCKER ENGINE
CREAR EL GRUPO DOCKER.
```bash
sudo groupadd docker
```
AÑADIR TU USUARIO AL GRUPO DOCKER
```bash
sudo usermod -aG docker $USER
```
CERRAR SESIÓN Y VOLVER A INICIAR SESIÓN PARA APLICAR LOS CAMBIOS

TAMBIÉN PUEDES EJECUTAR:
```bash
sudo newgrp docker
```
---
# INSTALAR PORTAINER AGENT EN DOCKER
EJECUTAR EL COMANDO PARA DESPLEGAR EL AGENTE PORTAINER
```bash
docker run -d 
-p 9001:9001 --name portainer_agent --restart=always \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /var/lib/docker/volumes:/var/lib/docker/volumes \
portainer/agent:latest
```
---
# UBIQUITI UISP REVERSE PROXY EN DOCKER
DESCARGAR E INSTALAR UISP CON CONFIGURACIÓN PARA REVERSE PROXY
```bash
curl -fsSL https://uisp.ui.com/install > /tmp/uisp_inst.sh && sudo bash /tmp/uisp_inst.sh --public-https-port 443 --http-port 7080 --https-port 7443
```
---
# UBIQUITI UNIFI NETWORK APPLICATION EN DOCKER
CREAR DIRECTORIOS NECESARIOS PARA LOS CONTENEDORES

ACCEDER AL DIRECTORIO PRINCIPAL
```bash
black@USVR:~$ cd /srv
```
CREAR EL DIRECTORIO PRINCIPAL PARA LOS CONTENEDORES
```bash
black@USVR:/srv$ sudo mkdir USVR-Docker
```
INGRESAR AL DIRECTORIO USVR-Docker
```bash
black@USVR:/srv$ cd USVR-Docker
```
CREAR EL DIRECTORIO PARA unifi-db
```bash
black@USVR:/srv/USVR-Docker$ sudo mkdir unifi-db
```
CREAR EL DIRECTORIO PARA Unifi-Server
```bash
black@USVR:/srv/USVR-Docker$ sudo mkdir Unifi-Server
```
MOVERSE DE DIRECTORIO unifi-db
```bash
black@USVR:/srv/USVR-Docker$ cd unifi-db
```
USAR NANO PARA CREAR Y EDITAR EL ARCHIVO init-mongo.js
```bash
black@USVR:/srv/USVR-Docker/unifi-db$ sudo nano init-mongo.js
```
EN EL ARCHIVO init-mongo.js INGRESA LA SIGUIENTE CONFIGURACIÓN
```bash
db.getSiblingDB("unifi").createUser({user: "unifi", pwd: "mSufJpHZH", roles: [{role: "dbOwner", db: "unifi"}]});
db.getSiblingDB("unifi_stat").createUser({user: "unifi", pwd: "mSufJpHZH", roles: [{role: "dbOwner", db: "unifi_stat"}]});
```
VERIFICA QUE LA CONFIGURACIÓN SEA CORRECTA
```bash
black@USVR:/srv/USVR-Docker/unifi-db$ cat init-mongo.js
```
---
# DOCKER COMPOSE FILE PARA LOS CONTENEDORES
```bash
version: "3" # VERSIÓN DEL ARCHIVO DOCKER COMPOSE

services: # DEFINE LOS SERVICIOS A EJECUTAR

  unifi-network-application: # NOMBRE DEL SERVICIO
    image: lscr.io/linuxserver/unifi-network-application:latest # IMAGEN A UTILIZAR
    container_name: unifi-network-application # NOMBRE PARA EL CONTENEDOR
    environment: # VARIABLES DE ENTORNO
      - PUID=1000 # ID DE USUARIO
      - PGID=1000 # ID DE GRUPO
      - TZ=America/Santo_Domingo # ZONA HORARIA
      - MONGO_USER=unifi # USUARIO
      - MONGO_PASS=mSufJpHZH # CONTRASEÑA
      - MONGO_HOST=unifi-db # HOST
      - MONGO_PORT=27017 # PUERTO
      - MONGO_DBNAME=unifi # NOMBRE DE LA BASE DE DATOS
      - MEM_LIMIT=1024 # LIMITE DE MEMORIA
      - MEM_STARTUP=1024 # MEMORIA ASIGNADA AL INICIAR
    volumes: # VOLUMENES A MONTAR
      - /srv/USVR-Docker/Unifi-Server/data:/config # MAPEO DE DIRECTORIO DEL HOST AL CONTENEDOR
    ports: # PUERTOS A UTILIZAR
      - 8443:8443 # HTTPS
      - 8080:8080 # HTTP
      - 3478:3478/udp # SERVICIO STUN
      - 10001:10001/udp # DESCUBRIMIENTO DE UNIFI AP
      - 1900:1900/udp # DLNA
      - 6789:6789 # PRUEBA DE VELOCIDAD MÓVIL
      - 5514:5514/udp # PUERTO ADICIONAL
    restart: unless-stopped # POLÍTICA DE REINICIO

  unifi-db: # NOMBRE DEL SERVICIO
    image: docker.io/mongo:4.4 # IMAGEN A UTILIZAR
    container_name: unifi-db # NOMBRE PARA EL CONTENEDOR
    volumes: # VOLUMENES A MONTAR
      - /srv/USVR-Docker/unifi-db/data:/data/db # PERSISTENCIA DE DATOS
      - /srv/USVR-Docker/unifi-db/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro # INICIALIZACIÓN
    restart: unless-stopped # POLITICA DE REINICIO
```
