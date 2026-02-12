import 'package:dio/dio.dart';

String parseApiError(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final payload = data["error"];
      if (payload is Map<String, dynamic>) {
        final message = payload["message"]?.toString();
        if (message != null && message.isNotEmpty) return message;
      }
    }
    return error.message ?? "Request failed";
  }
  return error.toString();
}
