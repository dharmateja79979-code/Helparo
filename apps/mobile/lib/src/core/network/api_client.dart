import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../app/session.dart';
import '../config/app_env.dart';

class ApiClient {
  ApiClient(this._dio);
  final Dio _dio;

  Future<Response<dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _dio.get(path, queryParameters: query);

  Future<Response<dynamic>> post(String path, {Object? data}) =>
      _dio.post(path, data: data);
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = Dio(BaseOptions(baseUrl: AppEnv.apiBaseUrl));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final supabaseToken = Supabase.instance.client.auth.currentSession?.accessToken;
        final appToken = ref.read(sessionProvider).appAccessToken;
        final token = (supabaseToken != null && supabaseToken.isNotEmpty) ? supabaseToken : appToken;
        if (token != null && token.isNotEmpty) {
          options.headers["Authorization"] = "Bearer ${token.trim()}";
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          try {
            await Supabase.instance.client.auth.signOut();
          } catch (_) {}
          try {
            await FirebaseAuth.instance.signOut();
          } catch (_) {}
          ref.read(sessionProvider.notifier).logout(
                reason: LogoutReason.sessionExpired,
              );
        }
        handler.next(error);
      },
    ),
  );
  return ApiClient(dio);
});
