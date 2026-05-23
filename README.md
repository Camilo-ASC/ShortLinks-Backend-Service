# 🔗 ShortLinks - Módulo 1: Acortamiento de URLs

Este módulo contiene el núcleo del sistema de acortamiento de enlaces, construido bajo una arquitectura serverless sobre AWS utilizando Node.js, TypeScript y Terraform para la gestión de infraestructura como código (IaC).

El objetivo principal de este componente es recibir una URL larga, validar su estructura, generar un identificador único y persistir la relación en una base de datos de alta disponibilidad y baja latencia.

---

## 🛠️ Arquitectura y Tecnologías

El backend está diseñado siguiendo un enfoque de microservicios orientados a eventos utilizando los siguientes servicios de AWS:

* **AWS Lambda:** Ejecución del handler principal para el procesamiento de la lógica de negocio sin aprovisionamiento de servidores.
* **Amazon API Gateway:** Exposición del endpoint HTTP seguro (`POST /shorten`) que actúa como puerta de enlace para las peticiones de los clientes.
* **Amazon DynamoDB:** Base de datos NoSQL utilizada para almacenar de manera eficiente los mapeos entre las URLs originales y los códigos cortos generados.

---

## 🚀 Endpoints

### Crear Enlace Acortado
* **Ruta:** `POST /shorten`
* **Content-Type:** `application/json`

**Cuerpo de la petición (Request Body):**
```json
{
  "longUrl": "[https://github.com/Camilo-ASC](https://github.com/Camilo-ASC)"
}
