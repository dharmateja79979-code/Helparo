import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'session.dart';

class SessionStorage {
  static const _key = "helparo_session";

  static Future<void> save(SessionState state) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = <String, dynamic>{
      "isLoggedIn": state.isLoggedIn,
      "role": state.role.name,
      "otpMode": state.otpMode.name,
      "appAccessToken": state.appAccessToken,
    };
    await prefs.setString(_key, jsonEncode(payload));
  }

  static Future<SessionState?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return SessionState(
        isLoggedIn: json["isLoggedIn"] == true,
        role: _roleFromString(json["role"]?.toString()),
        otpMode: _otpModeFromString(json["otpMode"]?.toString()),
        appAccessToken: json["appAccessToken"]?.toString(),
      );
    } catch (_) {
      return null;
    }
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  static AppRole _roleFromString(String? value) {
    switch (value) {
      case "helper":
        return AppRole.helper;
      case "customer":
      default:
        return AppRole.customer;
    }
  }

  static OtpMode _otpModeFromString(String? value) {
    switch (value) {
      case "emailSupabase":
        return OtpMode.emailSupabase;
      case "phoneFirebase":
      default:
        return OtpMode.phoneFirebase;
    }
  }
}
