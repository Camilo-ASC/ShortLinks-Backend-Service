variable "aws_region" {
  type        = string
  description = "Región de AWS donde se desplegarán los recursos"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Ambiente de despliegue (ej: dev, qa, prod)"
  default     = "dev"
}

variable "dynamodb_table_name" {
  type        = string
  description = "Nombre de la tabla compartida de DynamoDB"
  default     = "ShortenLinksDB"
}