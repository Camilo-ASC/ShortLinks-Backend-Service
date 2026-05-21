output "api_url" {
  description = "URL base del API Gateway. Usa este endpoint para tus pruebas."
  value       = "${aws_apigatewayv2_api.http_api.api_endpoint}/shorten"
}

output "lambda_arn" {
  description = "ARN de la función Lambda de acortamiento"
  value       = aws_lambda_function.shortener_lambda.arn
}