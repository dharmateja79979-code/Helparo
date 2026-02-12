import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/session.dart';
import '../../../core/network/api_client.dart';

class AuthController extends StateNotifier<AsyncValue<void>> {
  AuthController(this.ref) : super(const AsyncData(null));

  final Ref ref;
  String? _phoneVerificationId;
  int? _resendToken;

  Future<void> sendEmailOtp(String email) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await Supabase.instance.client.auth.signInWithOtp(email: email);
    });
  }

  Future<void> verifyEmailOtp({
    required String email,
    required String token,
    required AppRole role,
    String? name,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await Supabase.instance.client.auth.verifyOTP(
        email: email,
        token: token,
        type: OtpType.email,
      );
      await _bootstrapRole(role, name: name);
      ref.read(sessionProvider.notifier).setRole(role);
      ref.read(sessionProvider.notifier).loginSuccess(appAccessToken: null);
    });
  }

  Future<void> sendPhoneOtp(String phone) async {
    state = const AsyncLoading();
    final completer = Completer<void>();
    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: phone,
      forceResendingToken: _resendToken,
      verificationCompleted: (PhoneAuthCredential credential) async {
        await FirebaseAuth.instance.signInWithCredential(credential);
        if (!completer.isCompleted) completer.complete();
      },
      verificationFailed: (FirebaseAuthException e) {
        if (!completer.isCompleted) completer.completeError(e);
      },
      codeSent: (String verificationId, int? resendToken) {
        _phoneVerificationId = verificationId;
        _resendToken = resendToken;
        if (!completer.isCompleted) completer.complete();
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        _phoneVerificationId = verificationId;
      },
    );

    state = await AsyncValue.guard(() => completer.future);
  }

  Future<void> verifyPhoneOtp({
    required String smsCode,
    required AppRole role,
    String? name,
  }) async {
    final verificationId = _phoneVerificationId;
    if (verificationId == null) {
      state = AsyncError(StateError("Phone OTP is not initialized"), StackTrace.current);
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode,
      );
      await FirebaseAuth.instance.signInWithCredential(credential);
      final idToken = await FirebaseAuth.instance.currentUser?.getIdToken(true);
      if (idToken == null || idToken.isEmpty) {
        throw StateError("Could not get Firebase ID token");
      }
      final api = ref.read(apiClientProvider);
      final response = await api.post(
        "/auth/firebase/exchange",
        data: {
          "firebaseIdToken": idToken,
          "role": role == AppRole.customer ? "customer" : "helper",
          if (name != null && name.trim().isNotEmpty) "name": name.trim(),
        },
      );
      final envelope = response.data as Map<String, dynamic>;
      final data = (envelope["data"] as Map<String, dynamic>?) ?? {};
      final appToken = (data["accessToken"] ?? "").toString();
      if (appToken.isEmpty) throw StateError("Firebase exchange did not return app token");

      ref.read(sessionProvider.notifier).setRole(role);
      ref.read(sessionProvider.notifier).loginSuccess(appAccessToken: appToken);
    });
  }

  Future<void> _bootstrapRole(AppRole role, {String? name}) async {
    final api = ref.read(apiClientProvider);
    await api.post(
      "/auth/bootstrap",
      data: {
        "role": role == AppRole.customer ? "customer" : "helper",
        if (name != null && name.trim().isNotEmpty) "name": name.trim(),
      },
    );
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  return AuthController(ref);
});
