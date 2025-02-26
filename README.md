# Proyecto de BD
El objetivo es realizar un servicio web que actúe como el BACKEND de una aplicación web que facilite a los usuarios la gestión y almacenamiento de datos estructurados como grafos que residan en Neo4J

## Como utilizarlo?
Primero dirijite a la carpeta del backend
si no tienes 
express: para crear la API.
neo4j-driver: para conectar a AuraDB.
dotenv: para cargar las credenciales desde un archivo .env.

Ejectuta: 
 ```bash
  npm install express neo4j-driver dotenv
```


### Si quieres ejecutar los scripts de python:
Para los scripts de python quisimos hacer uso de Faker, pero para ello no estaba disponible en las versiones de python mas reciente por lo que tuvimos que bajar de version de python. Para ello y con la facilidad de estar utilizando *Manjaro Linux* entonces lo que hicimos fue: 

Pasos para configurar el entorno:
1. Instalar pyenv:
```bash
sudo pacman -S pyenv
```
2. Configurar el shell para usar pyenv:

Añadir lo siguiente a tu archivo de configuración del shell:

    Bash (~/.bashrc):
```bash
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
```
Recarga la shell utilizando:
```bash
exec $SHELL
```
3. Ahora si instala la version que esta disponible Faker: 
```bash
pyenv install 3.11.6
```

4. Ahora si configura el proyecto para utilizar esa version de python. 
```bash
cd scripts/
pyenv local 3.11.6
```


#### Configuracion ahora si del entorno virtual 
1. Crea el entorno virtual con:
 ```bash
  python -m venv venv
```
2.  Activar el entorno virtual:
```bash
  source venv/bin/activate
```
3. Instalar las dependencias:
```bash
  pip install -r requirements.txt
```
4. Verificar las dependencias instaladas:
```bash
  pip freeze
```

####  Restaurar Python 3.13 (opcional)
1. Eliminar la configuración local:
```bash
  rm .python-version
```
2. Restaurar Python 3.13 como versión global:
```bash
  pyenv global system
```
