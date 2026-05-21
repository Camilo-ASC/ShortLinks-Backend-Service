# 1. Archivo ZIP automático del código compilado
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/lambda_function.zip"
}

# 2. Rol de IAM para la Lambda (Permisos básicos y DynamoDB)
resource "aws_iam_role" "lambda_role" {
  name = "url-shortener-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

# Política de permisos específicos (CloudWatch + DynamoDB PutItem)
resource "aws_iam_policy" "lambda_policy" {
  name        = "url-shortener-policy-${var.environment}"
  description = "Permisos para escribir en DynamoDB y generar logs en CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${var.dynamodb_table_name}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# 3. Definición de la Función Lambda
resource "aws_lambda_function" "shortener_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "url-shortener-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handlers/shorten.handler" # Apunta a dist/handlers/shorten.js
  runtime          = "nodejs20.x"
  timeout          = 10

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }
}

# Grupo de logs en CloudWatch explícito para limpieza
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.shortener_lambda.function_name}"
  retention_in_days = 7
}

# 4. Configuración de API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "url-shortener-api-${var.environment}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Integración del API Gateway con la Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.shortener_lambda.invoke_arn
}

# Ruta específica requerida: POST /shorten
resource "aws_apigatewayv2_route" "shorten_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /shorten"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Permiso para que el API Gateway pueda ejecutar la Lambda
resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shortener_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# 5. Base de Datos Compartida (DynamoDB)
resource "aws_dynamodb_table" "urls_table" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "shortCode"

  attribute {
    name = "shortCode"
    type = "S" # Tipo String (Texto)
  }
}