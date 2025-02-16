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
mkdir -p /opt/ufs/data
mkdir -p /opt/ufdb/data/db
```

CREAR Y EDITAR EL ARCHIVO init-mongo.js

```bash
cd /opt/ufdb/
sudo nano init-mongo.sh
```

```bash
#!/bin/bash

if which mongosh > /dev/null 2>&1; then
  mongo_init_bin='mongosh'
else
  mongo_init_bin='mongo'
fi
"${mongo_init_bin}" <<EOF
use ${MONGO_AUTHSOURCE}
db.auth("${MONGO_INITDB_ROOT_USERNAME}", "${MONGO_INITDB_ROOT_PASSWORD}")
db.createUser({
  user: "${MONGO_USER}",
  pwd: "${MONGO_PASS}",
  roles: [
    { db: "${MONGO_DBNAME}", role: "dbOwner" },
    { db: "${MONGO_DBNAME}_stat", role: "dbOwner" }
  ]
})
EOF
```

```bash
sudo cat init-mongo.sh
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

services:
  unifi-network-application:
    image: lscr.io/linuxserver/unifi-network-application:latest
    container_name: unifi-network-application
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - MONGO_USER=unifi
      - MONGO_PASS=mSufJpHZH
      - MONGO_HOST=unifi-db
      - MONGO_PORT=27017
      - MONGO_DBNAME=unifi
      - MONGO_AUTHSOURCE=admin
    volumes:
      - /opt/ufs/data:/config
    ports:
      - 8443:8443
      - 3478:3478/udp
      - 10001:10001/udp
      - 8080:8080
      - 1900:1900/udp
      - 8843:8843
      - 8880:8880
      - 6789:6789
      - 5514:5514/udp
    restart: unless-stopped

  unifi-db:
    image: docker.io/mongo:5.0
    container_name: unifi-db
    volumes:
      - /opt/ufdb/data/db:/data/db
      - /opt/ufdb/init-mongo.sh:/docker-entrypoint-initdb.d/init-mongo.sh:ro
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=rootpassword
      - MONGO_USER=unifi
      - MONGO_PASS=mSufJpHZH
      - MONGO_DBNAME=unifi
      - MONGO_AUTHSOURCE=admin
    restart: unless-stopped
```

```bash
docker compose up
```

## Configuración del Servidor UniFi en Docker

### 1. Configurar el Inform Host en UniFi
- Accede a la interfaz web de UniFi.
- Dirígete a **Settings** > **System** > **Advanced**.
- En el campo **Inform Host**, ingresa la IP de tu servidor Docker, por ejemplo, `x.x.x.152`.
- Marca la opción **Override** para permitir que los dispositivos se conecten al controlador.

### 2. Asegurar la Comunicación entre Dispositivos
- Tu servidor DNS y DHCP en `x.x.x.52` debe ser capaz de resolver y asignar direcciones IP a los dispositivos en la red.
- Verifica que los dispositivos puedan acceder a la IP de tu servidor Docker `x.x.x.152`.

### 3. Configurar DHCP Gateway en UniFi
Si usas un Security Gateway y los dispositivos no obtienen una dirección IP, configura el **DHCP Gateway IP**:
- Ve a **Settings** > **Networks**.
- Selecciona la red correspondiente.
- Asegúrate de que la **DHCP Gateway IP** esté configurada con `x.x.x.52` (servidor DHCP).
