# USVR: Guía Detallada para Configurar Servicios de Ubiquiti UISP y Unifi Network Application en Docker

Objetivo:

Proporcionar una guía detallada para configurar y ejecutar eficientemente los servicios de Ubiquiti UISP (UNMS) y Unifi Network Application en Docker.

Contenido de la Guía:

1. Instalación de Docker y Portainer Agent.
1. Configuración de Direcciones IP Estáticas.
1. Creación de Directorios Esenciales.
1. Configuración de los Conectenedores.

---

## NETPLAN CONFIG

La configuración de Netplan es crucial para el funcionamiento adecuado de UISP (UNMS) y para aislar los equipos administrados a través de este sistema, evitando su accesibilidad para usuarios no autorizados y garantizando su administración exclusiva desde UISP (UNMS). Aunque es posible asignar la IP secundaria a una PC conectada a la misma red que el equipo de Ubiquiti para acceder a su configuración, esto no se recomienda debido a posibles conflictos de IP y otros problemas. Siempre es preferible administrar los equipos directamente desde UISP (UNMS).

COMANDO NECESARIOS:

```bash
sudo netplan generate
```

```bash
sudo cd /etc/netplan/
```

```bash
sudo nano 00-installer-config.yaml
```

CONFIGURACION:

```yaml
network:
  version: 2
  ethernets:
    eth0:  # NOMBRE DE LA INTERFAZ ETHERNET
      dhcp4: no  # DESHABILITAR DHCP PARA IPv4
      addresses: # DIRECCIONES IP ESTÁTICAS ASIGNADAS A eth0
        - 10.0.0.20/24 #IP PRIMARIA
        - 192.168.15.20/24 #IP SECUNDARIA UISP (UNMS)
      gateway4: 10.0.0.1  # PUERTA DE ENLACE IPv4 POR DEFECTO
      nameservers: # CONFIGURACIÓN DE SERVIDORES DNS
        addresses:  # DIRECCIONES IP DE SERVIDORES DNS
          - 1.1.1.1  # DNS de Cloudflare
          - 10.0.0.1 # Servidor DNS local
```

---

## INSTALACIÓN DE DOCKER ENGINE

Esta configuración sigue la misma estructura que la documentación oficial de Docker Engine. Si necesitas información adicional o simplemente prefieres seguir la guía original, te recomiendo consultarla directamente [Link](https://docs.docker.com/engine/install/). Los pasos que se presentan aquí están simplificados para garantizar que Docker funcione correctamente desde el primer intento y sin enfrentar problemas.

AGREGAR GPG KEY OFICIAL:

```bash
sudo apt-get update
```

```bash
sudo apt-get install ca-certificates curl
```

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```

```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

AGREGAR EL REPOSITORIO:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

```bash
sudo apt-get update
```

INSTALAR DOCKER:

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

GESTIONAR COMO USUARIO NO-ROOT:

```bash
sudo groupadd docker
```

```bash
sudo usermod -aG docker $USER #NOMBRE DE USUARIO
```

```bash
sudo newgrp docker
```

```bash
docker run hello-world
```

---

## INSTALAR PORTAINER

Portainer ofrece dos tipos de instalación: Portainer Server y Portainer Agent. En este caso, nos enfocaremos en la instalación del Portainer Agent. Si estás interesado en instalar el Portainer Server, te recomiendo que consultes la documentación oficial [Link](https://docs.portainer.io/start/install-ce/server/docker/linux).

EJECUTAR EL COMANDO PARA DESPLEGAR EL AGENTE PORTAINER

```bash
docker run -d 
-p 9001:9001 --name portainer_agent --restart=always \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /var/lib/docker/volumes:/var/lib/docker/volumes \
portainer/agent:latest
```

---

## UBIQUITI UISP (UNMS) DOCKER

UISP puede ser fácil de instalar cuando se encuentra en su propio servidor con una IP asignada, pero puede complicarse al integrarlo con otros servicios en un mismo servidor, como en este caso. La instalación se realiza a través de un enlace proporcionado por Ubiquiti, lo que limita las opciones de configuración a cambios de puertos o indicar que trabajará con reverse proxy. Esta dualidad lo hace tanto complejo como sencillo de manejar.

El objetivo principal es proporcionar dos métodos de instalación para UISP que no generen conflictos con Unifi Network Application. En ambos casos, es crucial ajustar los puertos de UISP para evitar interferencias con otros servicios.

MÉTODO 1: INSTALACIÓN BÁSICA

```bash
curl -fsSL https://uisp.ui.com/install > /tmp/uisp_inst.sh && sudo bash /tmp/uisp_inst.sh --http-port 7080 --https-port 7443
```

MÉTODO 2: INSTALACIÓN CON REVERSE PROXY

```bash
curl -fsSL https://uisp.ui.com/install > /tmp/uisp_inst.sh && sudo bash /tmp/uisp_inst.sh --public-https-port 443 --http-port 7080 --https-port 7443
```

En ambos casos de utilizaron los puertos HTTP 7080 y HTTPS 7443, es recomendable tener en cuenta para cuando se generan los links para agregar los dispositive cambiarlos ya que UISP por defecto siempre asigna el puerto 443 y esto puede generar conflicto en la adopcion de los dispisitivos que arremos agregar 

Link que nos genero UISP:
`wss://192.168.99.54:443+65465456454645687vh4hghjgfh`

Link con el puerto corregido:
 `wss://192.168.99.54:7443+65465456454645687vh4hghjgfh`

---

## UBIQUITI UNIFI NETWORK APPLICATION EN DOCKER

La instalación de Unifi Network Application en Docker puede ser un proceso algo complejo debido a la necesidad de crear dos contenedores para su funcionamiento, así como también la configuración de directorios específicos. Muchos proyectos relacionados con la instalación de Unifi en Docker están archivados, lo que puede dificultar su localización y configuración inicial.

CREAR DIRECTORIOS NECESARIOS PARA LOS CONTENEDORES

```bash
sudo cd /srv
```

```bash
sudo mkdir docker_data
```

```bash
sudo cd docker_data
```

```bash
sudo mkdir Unifi-Server
```

```bash
sudo mkdir unifi-db
```

```bash
sudo cd unifi-db
```

CREAR Y EDITAR EL ARCHIVO init-mongo.js

```bash
sudo nano init-mongo.js
```

```bash
db.getSiblingDB("unifi").createUser({user: "unifi", pwd: "mSufJpHZH", roles: [{role: "dbOwner", db: "unifi"}]});
db.getSiblingDB("unifi_stat").createUser({user: "unifi", pwd: "mSufJpHZH", roles: [{role: "dbOwner", db: "unifi_stat"}]});
```

```bash
sudo cat init-mongo.js
```

### DOCKER COMPOSE FILE PARA LOS CONTENEDORES

Luego haber completado los pasos anteriores correctamente, especialmente la creación del archivo init-mongo.js, ya que cualquier error en este archivo puede generar conflictos y requerir iniciar el proceso nuevamente eliminando el archivo init-mongo.js creado previamente.

CREACION DEL ARCHIVO YAML

```bash
sudo cd /srv/docker_data
```

```bash
sudo nano unifi-compose.yaml
```

```yaml
---
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

```bash
docker compose up
```

---
