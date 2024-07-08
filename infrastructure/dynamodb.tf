resource "aws_dynamodb_table" "feedback" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "notificationId"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "notificationId"
    type = "S"
  }
  
  tags = {
    Name = var.dynamodb_table_name
  }
}


resource "aws_dynamodb_table_item" "item_1" {
  table_name = aws_dynamodb_table.feedback.name
  hash_key = aws_dynamodb_table.feedback.hash_key
  range_key = aws_dynamodb_table.feedback.range_key

  item = <<ITEM
{
  "userId": {"S": "1"},
  "notificationId": {"S": "d39ba4ad-8cd9-4ae8-aa66-0f639033f72b"},
  "message": {"S": "This is a notification"},
  "timestamp": {"S": "1720449849806"}
}
ITEM
}


      
      
      