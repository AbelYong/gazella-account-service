# Gazella Account Service #

## Ejecutando el servicio ##

### Prerequisitos ###

* Necesita tener configurado y corriendo el [IdP de Gazella](https://github.com/AbelYong/idp).
* Necesita tener configurado y corriendo el [API Gateway de Gazella](https://github.com/AbelYong/gazella-api-gateway)
* Necesita tener configurada y ejecutandose *RabbitMQ* y un usuario de RabbitMQ

### Pasos ###

Clone el repositorio y ejecute:

```bash
npm install
```

Cree un archivo **.env** como el siguiente:

```text
PORT=5000
DB_ADMIN=
DB_NAME=
DB_USER=
DB_USER_PASS=
DATABASE_ADMIN_URL=postgresql://[user]:[pass]@[db-server]:5432/[db-name]
DATABASE_URL=postgresql://[user]:[pass]@[db-server]:5432/[db-name]
RABBITMQ_URL=amqp://[rabbitMQUser]:[pass]@[rabbitMQ-server]:5672/%2fgazella
ISSUER_URL=[direccion del gateway gazella]
```

Ademas cree un archivo llamado **pg_password.txt** en la raíz del proyecto, dentro coloque una sola linea con la contraseña del **admin** de la BD

Genere el script .sql de la base de datos:

```bash
npm run db:generate
```

Genere y levante el contenedor:

```bash
docker compose up --build
```

Si tuvo exito debera ver un log como este en la consola:

```text
accounts_service   | [RabbitMQ] Connecting to RabbitMQ
accounts_service   | [RabbitMQ] Connection to RabbitMQ succesfully established
accounts_service   | [RabbitMQ] Toplogy configured (Account -> Wait -> Account | DLQ)
accounts_service   | [RabbitMQ] RabbitMQ Channel succesfully created
accounts_service   | Account Service listening on 5000
``
