import 'package:dio/dio.dart';

bool _isRetriable(Object error) {
  if (error is DioException) {
    final code = error.response?.statusCode ?? 0;
    if (code >= 500) return true;
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout;
  }
  return false;
}

Future<T> withRetry<T>(
  Future<T> Function() fn, {
  int maxAttempts = 2,
}) async {
  Object? lastError;
  for (int i = 1; i <= maxAttempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!_isRetriable(e) || i == maxAttempts) rethrow;
      await Future<void>.delayed(Duration(milliseconds: 200 * i));
    }
  }
  throw lastError!;
}
